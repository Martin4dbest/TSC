from fastapi import FastAPI
from fastapi.responses import FileResponse

app = FastAPI(title="TSC API")

@app.get("/")
def root():
    return {"message": "TSC Backend Running"}


@app.get("/favicon.ico", include_in_schema=False)
def favicon():
    return FileResponse("favicon.ico")