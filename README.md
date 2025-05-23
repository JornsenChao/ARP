# workflow

## Essential Workflow for user to execute research

Some are strictly after another, some can run concurrently with some other tasks

### Step 1: Identify hazard (This must be the first step.)

In this step, user will enter location (State, county) and call api from FEMA to get data about historic hazard happened here. Considering there can be many hazards, the data retreived from FEMA will be processed, then displayed to user.

### Step 2: Assess Risk (this comes after finishing 1)

In side this step, user will enter the hazard and project detail information in a strictly one-after-one wizard to qualitatively assess the impact of hazard on different system and user of the project, then select the top hazards as prioritized ones.

Meanwhile, user can always search the "library", asking questions like "how does this hazard impact building system A" "occupant B" etc. Let's just limit the current question to these.

When user have finishing screening all hazard-assets, and prioritized the tops hazards, they can make this as finish and go to next several "concurrent" steps.

By now, user have already get these that saved in "project context":

- top hazards
- project

### Step 3: (this comes after finishing 1 and 2)

inside step3, there are several sub-task that can concurrently with each other. However, even temporary/unsubmitted data user put will be "memorized"

#### task A:Ask for case study (this can run concurrently with B and C)

In this step, user will search for case studies from "hazard-location-assets of concern"; The returned result might not meet all the "context" but can still be helpful.
RAG is the backend search function.
Return: case study summary (context, link)
User can specify if want to search for only internal project or not

#### task B: Ask for strategy (this can run concurrently with A and C)

In this step, user will search for design strategies
m "hazard-location-assets of concern"; The returned result might not meet all the "context" but can still be helpful.
Return: strategy and summary (context, link)

#### task C: Ask for other resources (this can run concurrently with A and B)

In this step, user can search for:
fund & grant, insurance, map, code/guideline

### Step 4: summarize and export research (this comes after 1, 2, and 3 are marked as completed)

# code used in each step

## step 3:

### 前端

#### frontend/src/pages/essentialWorkflow/Step3ParallelTasks.jsx

这是 Step3 的主要前端页面，用户在 A/B/C 三个并行子任务中输入查询，前端调用 /multiRAG/query 等后端接口来实现检索。

## 后端

#### backendJS/routes/multiRAGRoutes.js

定义了 /multiRAG/query, /multiRAG/queryCoT, /multiRAG/buildGraph 等路由，与 Step3 前端调用对应。

#### backendJS/controllers/multiRAGController.js

具体实现了 multyRAGQuery, multyRAGQueryCoT, multyRAGBuildGraph 等 Controller 方法，对应前端 Step3 的 RAG 检索与图谱构建请求。

#### backendJS/services/multiRAGService.js

这里定义了实际的 RAG 逻辑：从 fileService.getStoresByKeys(fileKeys) 拿到 store，执行 similaritySearch，以及组装 Prompt 等。Step3 的 /multiRAG/query 最终会调用这里。

#### backendJS/services/graphService.js

若 Step3 中使用“构建可视化 Graph”，则会在 /multiRAG/buildGraph 中调用 graphService.buildGraphDataFromDocs()。如果你用到了“GraphViewer”在前端可视化，就会间接用到这个文件。

## file management

### 后端

#### backendJS/routes/conversationRoutes.js

GET /conversation/quicktalk：对话式检索某个文件内容并返回回答

POST /conversation/memory：将用户/AI 发言保存进对话向量库

GET /conversation/memory：检索历史对话片段

#### backendJS/controllers/quickTalkRAGController.js

实现上面 GET /conversation/quicktalk 路由对应的控制器逻辑。

主要做以下：

根据 sessionId 从 conversationService 获取对话内容

根据 fileKey 从 fileService 获取 memory store

然后调用 quickTalkRAGService.quickTalkRAGMultiSource(...) 做多源 RAG 检索

最终返回回答文本。

#### backendJS/services/quickTalkRAGService.js

里面有 quickTalkRAGMultiSource(...)，将 conversation docs + 文件 store docs 合并，拼 Prompt 给 LLM 等。

或者更简单的 quickTalkRAG(...) 用单一文件 store 做检索。

conversationController.js

POST /conversation/memory 用 conversationService.saveMessage(...) 将一段对话嵌入存储

GET /conversation/memory 用 conversationService.retrieveMessages(...) 在对话向量库中检索相似片段

conversationService.js

维护 { sessionId -> MemoryVectorStore }。

saveMessage(...)：将发言文本做 embedding 存进 store

retrieveMessages(...)：相似度检索历史对话

#### backendJS/services/fileService.js（间接）

在“File Chat”时，会用到 fileService.getMemoryStore(fileKey) 获取文件的向量存储，供 QuickTalkRAG 做检索。

虽然这是主要在 “File Management”里点击“Chat”后使用，但从代码上 fileService 也被 QuickTalkRAG 依赖来拿 store。

以上文件是“对话式地与某文件交流”在后端的主要逻辑所在。你如果在 “File Management”界面里点击 Chat，其请求就会流向这些 routes/controller/service 文件。

### 前端

#### FileManagement.jsx

UI 中有一个列表展示已上传的文件，每行若 storeBuilt===true，会有一个“Chat”按钮。

点击后会设置 activeChatFile = thatFileKey，并展示一个聊天面板（参见下文的 Chat 组件）

发消息时，会调用后端 /conversation/memory 存储对话，再 /conversation/quicktalk 做检索得到回答。

#### ChatComponent.js / RenderQA.js

这两个是“聊天交互”相关的前端组件：

ChatComponent.js: 处理输入框、发送问题给后端 /conversation/quicktalk 并更新回答

RenderQA.js: 可能用于渲染对话列表，或把 Q/A 以简洁 UI 显示

你的项目里在 FileManagement.jsx 里常会配合 ChatComponent、RenderQA 去实现与文件对话。

#### conversationService（前端并没有对应服务）

在前端，你只是在 FileManagement.jsx 里直接用 axios 请求 /conversation/???；不存在单独前端 service。

# Toolkit for user comtributing their own data

### Universal metadata schema: how data is labeled

• Design a single, cross‑format schema recorded for every upload (PDF, Excel, CSV, image).
• Core fields: fileKey, title, description, tags[], sourceType (pdf/xlsx/…), createdAt, vectorStorePath, plus any user‑defined key‑value pairs.
• Store alongside the file record in DB / files table.

below is a just a demo

```
{
  "fileKey": "uuid‑or‑path",          // primary key – never changes
  "title": "Boston Climate Study 2023",
  "description": "FEMA report on projected SLR and flood risk",
  "tags": ["flood", "sea‑level‑rise", "case‑study"],
  "sourceType": "pdf",                // pdf | xlsx | csv | txt | image | geojson …
  "createdAt": "2024‑04‑18T12:33:55Z",
  "vectorStorePath": "stores/<fileKey>",
  "size": 5_342_221,                  // bytes
  "pageCount": 112,                   // for pdf
  "sheetNames": ["Sheet1", "Sheet2"], // for xlsx
  "location": {                       // optional geo info for resilience data
    "lon": -71.06,
    "lat": 42.36,
    "place": "Boston, MA"
  },
  "resilienceContext": {              // 🍃 additional fields relevant to AEC/AR
    "hazardTypes": ["flood", "storm surge"],
    "projectScale": "campus",         // site | building | campus | district
    "framework": "AIA Framework",
    "stage": "assessment"             // assessment | design | evaluation
  },
  "columnMap": {                      // saved from dynamic mapper (for tables)
    "Hazard": ["Hazard", "Disaster Type"],
    "Strategy": ["Mitigation Option"],
    "Stakeholder": ["Owner", "Agency"]
  },
  "custom": {                         // user‑defined free‑form KV
    "preparedBy": "Jane Doe, ARUP"
  }
}
```

### chunking & cleaning (just pdf, csv)

• Focus on chunking & cleaning text (all formats).
• For PDFs: ignore images for now; extract text & tables (cross‑page) → chunk.
• For CSV: row‑level or column‑aware chunking.
• Build a consistent “DocumentChunk” object {chunkId, fileKey, text, metadata:{page#, sheet#, rowRange,…}} and push to vector store.

### Dynamic column mapper (not the current hard-coded categories)

• Replace the current hard‑coded 3 categories with a semantics‑driven mapper:
  – User defines an arbitrary semantic label (e.g. “Hazard”, “Strategy”, “Stakeholder”).
  – Maps 1‑N columns to that label.
• Persist mapping JSON in file metadata so ingestion can label each value.

### search & ranking

Primary ranking happens at retrieval time (RAG).
• Keep file‑level browse filters (tags, type, location).
• Inside RAG: similarity score + optional recency/popularity signals.
• UI will show top‑k chunks with score
