from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Resilience Research Platform API", version="0.2")

# 允许前端 (http://localhost:3000) 跨域访问
origins = ["http://localhost:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 静态示例数据：任务和资源
tasks_data = [
    {"id": 1, "title": "Risk Identification", "description": "Identify potential risks in the project."},
    {"id": 2, "title": "Risk Assessment", "description": "Evaluate the probability and impact of risks."},
    {"id": 3, "title": "Strategy Formulation", "description": "Develop strategies to mitigate identified risks."}
]

resources_data = [
    {"id": 1, "title": "Flood Risk Data", "description": "Data and analysis on flood risks."},
    {"id": 2, "title": "Earthquake Safety Guidelines", "description": "Guidelines for building earthquake resilient structures."},
    {"id": 3, "title": "Climate Change Impact Report", "description": "Report on climate change impacts in coastal areas."}
]

precedents_data = [
    {"id": 0, "title": "Build your own search filter", "description": "Drag these filter field to your workflow"},
    {"id": 1, "title": "By Project Type", "description": "Healthcare"},
    {"id": 2, "title": "By Project Stage", "description": "RFP/Pursuit, Conceptual Design, Design Development"},
    {"id": 3, "title": "By Project Hazard", "description": "Earthquake, Flood, Wildfire"},
    {"id": 4, "title": "By Project Geolocation", "description": "Pacific North West, South East"},
]

@app.get("/")
def read_root():
    return {"message": "Hello World from FastAPI"}

@app.get("/tasks")
def get_tasks():
    return tasks_data

@app.get("/tasks/{task_id}")
def get_task(task_id: int):
    task = next((task for task in tasks_data if task["id"] == task_id), None)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

@app.get("/resources")
def get_resources(query: str = None):
    # 暂不处理 query 参数，返回静态数据
    return resources_data

@app.get("/precedents")
def get_precedents(query: str = None):
    # 暂不处理 query 参数，返回静态数据
    return precedents_data

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
