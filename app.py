from collections import UserList
import os
from pathlib import Path
import warnings
import joblib
import pandas as pd
from pydantic import BaseModel
import sklearn.compose._column_transformer
from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

# ponytail: compatibility shim for scikit-learn >=1.7 unpickling <=1.6 ColumnTransformer
if not hasattr(sklearn.compose._column_transformer, "_RemainderColsList"):
    sklearn.compose._column_transformer._RemainderColsList = type(
        "_RemainderColsList", (UserList,), {}
    )

warnings.filterwarnings("ignore")

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "model" / "model_ecommerce_churn.joblib"
model = joblib.load(MODEL_PATH)

# ponytail: compatibility patch for SimpleImputer._fill_dtype across scikit-learn versions
if hasattr(model, "named_steps") and "preprocessor" in model.named_steps:
    preprocessor = model.named_steps["preprocessor"]
    for attr in ("transformers_", "transformers"):
        for item in getattr(preprocessor, attr, []):
            transformer = item[1] if len(item) > 1 else None
            if transformer is not None and hasattr(transformer, "named_steps"):
                imputer = transformer.named_steps.get("imputer")
                if imputer and not hasattr(imputer, "_fill_dtype"):
                    imputer._fill_dtype = getattr(imputer, "_fit_dtype", None)

app = FastAPI(title="E-Commerce Churn Prediction API")
app.mount("/static", StaticFiles(directory=BASE_DIR / "static"), name="static")


class CustomerInput(BaseModel):
    age: float
    tenure_months: float
    avg_order_value: float
    total_orders: float
    last_purchase_days_ago: float
    support_tickets: float
    gender: str
    city: str
    subscription_type: str


@app.get("/")
def index():
    return FileResponse(BASE_DIR / "static" / "index.html")


@app.post("/predict")
def predict(data: CustomerInput):
    df = pd.DataFrame([data.model_dump()])
    pred = int(model.predict(df)[0])
    prob = float(model.predict_proba(df)[0][1])
    return {"prediction": pred, "probability": prob}


if __name__ == "__main__":
    import socket
    import uvicorn

    default_port = 8000
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        if s.connect_ex(("127.0.0.1", 8000)) == 0:
            default_port = 5000

    port = int(os.getenv("PORT", default_port))
    print(f"Server berjalan di: http://127.0.0.1:{port}")
    uvicorn.run(app, host="127.0.0.1", port=port)
