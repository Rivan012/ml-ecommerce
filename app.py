from collections import UserList
from contextlib import asynccontextmanager
from pathlib import Path
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

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "model" / "model_ecommerce_churn.joblib"
model = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global model
    model = joblib.load(MODEL_PATH)
    yield


app = FastAPI(title="E-Commerce Churn Prediction API", lifespan=lifespan)
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
    import uvicorn

    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
