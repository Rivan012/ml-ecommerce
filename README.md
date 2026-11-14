# Prediksi Churn Pelanggan E-Commerce

Sistem prediksi risiko *customer churn* berbasis Machine Learning menggunakan FastAPI dan Scikit-Learn. Dikembangkan untuk keperluan Tugas Besar Praktikum Machine Learning.

## Struktur Direktori

```text
ml-ecommerce/
├── app.py                           # Backend server FastAPI & API handler
├── requirements.txt                 # Dependensi Python
├── model/
│   └── model_ecommerce_churn.joblib # Pipeline Scikit-Learn (Preprocessor + Logistic Regression)
└── static/
    ├── index.html                   # Halaman antarmuka form input
    ├── style.css                    # Styling visual & responsif
    └── app.js                       # Logic interaksi form & fetch API
```

## Fitur Input

| Fitur | Tipe | Deskripsi | Rentang / Opsi |
| :--- | :--- | :--- | :--- |
| `age` | Numerik | Usia pelanggan (tahun) | 18 - 100 |
| `tenure_months` | Numerik | Lama berlangganan (bulan) | 0 - 120 |
| `avg_order_value` | Numerik | Rata-rata nilai pesanan (USD) | 0.0 - 10000.0 |
| `total_orders` | Numerik | Total pesanan yang diselesaikan | 0 - 1000 |
| `last_purchase_days_ago` | Numerik | Hari sejak pembelian terakhir | 0 - 730 |
| `support_tickets` | Numerik | Jumlah tiket komplain/bantuan | 0 - 50 |
| `gender` | Kategorikal | Jenis kelamin | `Female`, `Male` |
| `city` | Kategorikal | Kota domisili | `Bangalore`, `Chennai`, `Delhi`, `Hyderabad`, `Kolkata`, `Mumbai`, `Pune` |
| `subscription_type` | Kategorikal | Tingkat paket keanggotaan | `Basic`, `Silver`, `Gold`, `Platinum` |

## Instalasi & Cara Menjalankan

### 1. Clone Repositori
```bash
git clone https://github.com/Rivan012/ml-ecommerce.git
cd ml-ecommerce
```

### 2. Install Dependensi
```bash
pip install -r requirements.txt
```

### 3. Jalankan Server
```bash
python app.py
```
Akses antarmuka web melalui browser di: `http://127.0.0.1:5000`

## Endpoint API

- `GET /` : Menyajikan antarmuka form web.
- `POST /predict` : Memproses payload JSON data pelanggan dan mengembalikan prediksi churn beserta probabilitasnya.

Contoh payload:
```json
{
  "age": 30,
  "tenure_months": 12,
  "avg_order_value": 150.5,
  "total_orders": 25,
  "last_purchase_days_ago": 15,
  "support_tickets": 3,
  "gender": "Female",
  "city": "Bangalore",
  "subscription_type": "Basic"
}
```

Contoh response:
```json
{
  "prediction": 0,
  "probability": 0.1689
}
```
