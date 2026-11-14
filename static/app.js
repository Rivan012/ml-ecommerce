// ============================================
// ELEMEN DOM
// ============================================
const form = document.getElementById("predict-form");
const btnPredict = document.getElementById("btn-predict");
const btnText = btnPredict.querySelector(".btn-text");
const btnLoading = btnPredict.querySelector(".btn-loading");
const resultSection = document.getElementById("result-section");
const errorSection = document.getElementById("error-section");
const errorMessage = document.getElementById("error-message");
const resultCard = document.getElementById("result-card");
const resultIcon = document.getElementById("result-icon");
const resultLabel = document.getElementById("result-label");
const progressBar = document.getElementById("progress-bar");
const probValue = document.getElementById("prob-value");
const resultDescription = document.getElementById("result-description");

// ============================================
// DAFTAR FIELD INPUT
// ============================================
const NUMERIC_FIELDS = [
    "age",
    "tenure_months",
    "avg_order_value",
    "total_orders",
    "last_purchase_days_ago",
    "support_tickets",
];

const CATEGORICAL_FIELDS = ["gender", "city", "subscription_type"];

// ============================================
// VALIDASI FORM
// ============================================
function validateForm() {
    // Cek semua field numerik
    for (const field of NUMERIC_FIELDS) {
        const input = document.getElementById(field);
        const value = input.value.trim();

        if (value === "") {
            return { valid: false, message: `Field "${input.previousElementSibling.textContent}" wajib diisi.` };
        }

        const num = Number(value);
        if (isNaN(num)) {
            return { valid: false, message: `Field "${input.previousElementSibling.textContent}" harus berupa angka.` };
        }

        const min = parseFloat(input.min);
        const max = parseFloat(input.max);
        if (num < min || num > max) {
            return {
                valid: false,
                message: `Field "${input.previousElementSibling.textContent}" harus dalam rentang ${min} - ${max}.`,
            };
        }
    }

    // Cek semua field kategorikal
    for (const field of CATEGORICAL_FIELDS) {
        const select = document.getElementById(field);
        if (select.value === "") {
            return { valid: false, message: `Field "${select.previousElementSibling.textContent}" wajib dipilih.` };
        }
    }

    return { valid: true, message: "" };
}

// ============================================
// AMBIL DATA DARI FORM
// ============================================
function getFormData() {
    const data = {};

    for (const field of NUMERIC_FIELDS) {
        data[field] = parseFloat(document.getElementById(field).value);
    }

    for (const field of CATEGORICAL_FIELDS) {
        data[field] = document.getElementById(field).value;
    }

    return data;
}

// ============================================
// TAMPILKAN HASIL PREDIKSI
// ============================================
function displayResult(response) {
    // Sembunyikan error jika ada
    errorSection.hidden = true;

    // Tampilkan section hasil
    resultSection.hidden = false;

    const prediction = response.prediction;
    const probability = response.probability;
    const probPercent = (probability * 100).toFixed(1);

    // Tentukan status churn atau tidak
    const isChurn = prediction === 1 || prediction === "Churn";

    // Reset kelas
    resultCard.classList.remove("churn", "no-churn");

    if (isChurn) {
        resultCard.classList.add("churn");
        resultIcon.textContent = "🚨";
        resultLabel.textContent = "BERISIKO CHURN";
        resultDescription.textContent =
            "Pelanggan ini memiliki risiko tinggi untuk berhenti berlangganan. " +
            "Disarankan untuk melakukan pendekatan retensi seperti penawaran khusus, " +
            "peningkatan layanan, atau komunikasi proaktif.";
    } else {
        resultCard.classList.add("no-churn");
        resultIcon.textContent = "✅";
        resultLabel.textContent = "TIDAK BERISIKO CHURN";
        resultDescription.textContent =
            "Pelanggan ini diprediksi akan tetap bertahan. " +
            "Tetap jaga kualitas layanan dan pengalaman berbelanja " +
            "untuk mempertahankan loyalitas pelanggan.";
    }

    // Update progress bar
    progressBar.style.width = probPercent + "%";
    progressBar.textContent = probPercent + "%";

    // Warna progress bar berdasarkan tingkat probabilitas
    progressBar.classList.remove("low", "medium", "high");
    if (probability < 0.35) {
        progressBar.classList.add("low");
    } else if (probability < 0.65) {
        progressBar.classList.add("medium");
    } else {
        progressBar.classList.add("high");
    }

    probValue.textContent = probPercent + "% kemungkinan churn";

    // Scroll ke hasil
    resultSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ============================================
// TAMPILKAN ERROR
// ============================================
function displayError(message) {
    resultSection.hidden = true;
    errorSection.hidden = false;
    errorMessage.textContent = message;

    errorSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ============================================
// TOGGLE LOADING STATE
// ============================================
function setLoading(isLoading) {
    btnPredict.disabled = isLoading;
    btnText.hidden = isLoading;
    btnLoading.hidden = !isLoading;
}

// ============================================
// EVENT: SUBMIT FORM (FETCH API)
// ============================================
form.addEventListener("submit", async function (e) {
    // Mencegah page reload
    e.preventDefault();

    // Validasi input
    const validation = validateForm();
    if (!validation.valid) {
        displayError(validation.message);
        return;
    }

    // Ambil data form
    const formData = getFormData();

    // Set loading state
    setLoading(true);
    errorSection.hidden = true;
    resultSection.hidden = true;

    try {
        // Kirim request ke backend menggunakan Fetch API
        const response = await fetch("/predict", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(formData),
        });

        // Cek apakah response berhasil
        if (!response.ok) {
            const errorData = await response.json().catch(() => null);

            if (response.status === 422 && errorData && errorData.detail) {
                // Validation error dari Pydantic
                const details = errorData.detail;
                const messages = details.map(function (d) {
                    const field = d.loc[d.loc.length - 1];
                    return field + ": " + d.msg;
                });
                throw new Error("Validasi gagal — " + messages.join("; "));
            }

            throw new Error(
                errorData && errorData.detail
                    ? errorData.detail
                    : "Terjadi kesalahan pada server (HTTP " + response.status + ")"
            );
        }

        // Parse response JSON
        const result = await response.json();

        // Tampilkan hasil
        displayResult(result);
    } catch (error) {
        // Tangani error jaringan atau server
        if (error.name === "TypeError" && error.message === "Failed to fetch") {
            displayError("Tidak dapat terhubung ke server. Pastikan backend sudah berjalan.");
        } else {
            displayError(error.message);
        }
    } finally {
        // Matikan loading state
        setLoading(false);
    }
});

// ============================================
// EVENT: RESET FORM
// ============================================
form.addEventListener("reset", function () {
    // Sembunyikan hasil dan error saat form direset
    resultSection.hidden = true;
    errorSection.hidden = true;
});
