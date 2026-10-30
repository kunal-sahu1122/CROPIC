import os
import json
import asyncio
import pymongo
from motor.motor_asyncio import AsyncIOMotorClient

# MongoDB connection settings
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://127.0.0.1:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "cropic")

class JSONFallbackCollection:
    def __init__(self, name: str):
        self.name = name
        # Place JSON file in backend folder
        self.file_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 
            f"{name}_db.json"
        )
        if not os.path.exists(self.file_path):
            with open(self.file_path, "w") as f:
                json.dump([], f)

    async def insert_one(self, document):
        # Emulate MongoDB behavior of mutating the dict to add _id
        if "_id" not in document:
            import uuid
            document["_id"] = str(document.get("claim_id", uuid.uuid4()))
            
        loop = asyncio.get_event_loop()
        def _sync_insert():
            try:
                with open(self.file_path, "r") as f:
                    data = json.load(f)
            except Exception:
                data = []
            
            data.append(document)
            
            with open(self.file_path, "w") as f:
                json.dump(data, f, indent=4)
                
        await loop.run_in_executor(None, _sync_insert)
        
        class MockResult:
            def __init__(self, inserted_id):
                self.inserted_id = inserted_id
        return MockResult(document["_id"])

    async def find_one(self, query):
        loop = asyncio.get_event_loop()
        def _sync_find():
            try:
                with open(self.file_path, "r") as f:
                    data = json.load(f)
            except Exception:
                return None
            
            for doc in data:
                match = True
                for k, v in query.items():
                    if doc.get(k) != v:
                        match = False
                        break
                if match:
                    return doc
            return None
        return await loop.run_in_executor(None, _sync_find)

    async def delete_one(self, query):
        loop = asyncio.get_event_loop()
        def _sync_delete():
            try:
                with open(self.file_path, "r") as f:
                    data = json.load(f)
            except Exception:
                return
            
            new_data = []
            for doc in data:
                match = True
                for k, v in query.items():
                    if doc.get(k) != v:
                        match = False
                        break
                if not match:
                    new_data.append(doc)
            
            with open(self.file_path, "w") as f:
                json.dump(new_data, f, indent=4)
        await loop.run_in_executor(None, _sync_delete)

    def find(self, query):
        try:
            with open(self.file_path, "r") as f:
                data = json.load(f)
        except Exception:
            data = []
        
        results = []
        for doc in data:
            match = True
            for k, v in query.items():
                if doc.get(k) != v:
                    match = False
                    break
            if match:
                results.append(doc)
        
        class MockCursor:
            def __init__(self, items):
                self.items = items
            async def to_list(self, length: int = 100):
                return self.items[:length]
        
        return MockCursor(results)


    async def update_one(self, query, update):
        loop = asyncio.get_event_loop()
        def _sync_update():
            try:
                with open(self.file_path, "r") as f:
                    data = json.load(f)
            except Exception:
                data = []
            
            modified_count = 0
            for doc in data:
                match = True
                for k, v in query.items():
                    if doc.get(k) != v:
                        match = False
                        break
                if match:
                    if "$set" in update:
                        for uk, uv in update["$set"].items():
                            doc[uk] = uv
                        modified_count += 1
                    break
            
            if modified_count > 0:
                with open(self.file_path, "w") as f:
                    json.dump(data, f, indent=4)
            
            class MockUpdateResult:
                def __init__(self, count):
                    self.modified_count = count
            return MockUpdateResult(modified_count)
            
        return await loop.run_in_executor(None, _sync_update)

    async def count_documents(self, query):
        loop = asyncio.get_event_loop()
        def _sync_count():
            try:
                with open(self.file_path, "r") as f:
                    data = json.load(f)
            except Exception:
                return 0
            
            count = 0
            for doc in data:
                match = True
                for k, v in query.items():
                    if doc.get(k) != v:
                        match = False
                        break
                if match:
                    count += 1
            return count
        return await loop.run_in_executor(None, _sync_count)



class DatabaseManager:
    def __init__(self):
        self.use_fallback = False
        self.client = None
        self.db = None
        
        # Test connection synchronously using standard pymongo to fail fast
        try:
            print(f"Checking MongoDB availability at {MONGODB_URI}...")
            temp_client = pymongo.MongoClient(MONGODB_URI, serverSelectionTimeoutMS=1000)
            temp_client.server_info() # Triggers connection check
            
            # If successful, initialize Async Motor client
            self.client = AsyncIOMotorClient(MONGODB_URI)
            self.db = self.client[DATABASE_NAME]
            print("MongoDB is running! Connected successfully.")
        except Exception as e:
            print(f"MongoDB connection failed: {e}")
            print(">>> Falling back to local JSON database (claims_db.json) for seamless offline development.")
            self.use_fallback = True

    def get_collection(self, name: str):
        if self.use_fallback:
            return JSONFallbackCollection(name)
        return self.db[name]

# Global instance
_db_manager = None

def get_database():
    global _db_manager
    if _db_manager is None:
        _db_manager = DatabaseManager()
    return _db_manager

def get_collection(collection_name: str):
    manager = get_database()
    return manager.get_collection(collection_name)
