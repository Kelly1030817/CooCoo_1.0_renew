import type { RecipePackage } from "@coocoo/contracts";

const DB_NAME = "coocoo-offline";
const DB_VERSION = 2;
const STORE = "recipe-packages";
const OPERATIONS_STORE = "offline-operations";
const IMAGE_CACHE = "coocoo-recipe-images-v1";

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE)) database.createObjectStore(STORE, { keyPath: "id" });
      if (!database.objectStoreNames.contains(OPERATIONS_STORE)) database.createObjectStore(OPERATIONS_STORE, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveRecipePackage(recipePackage: RecipePackage) {
  const packageWithTimestamp = { ...recipePackage, downloadedAt: new Date().toISOString() };
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE, "readwrite");
    transaction.objectStore(STORE).put(packageWithTimestamp);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  if (recipePackage.imageUrl) {
    try {
      const cache = await caches.open(IMAGE_CACHE);
      await cache.add(recipePackage.imageUrl);
    } catch {
      // Text is the offline-critical asset. The cooking UI uses the branded fallback when the image misses.
    }
  }
  return packageWithTimestamp;
}

export async function getRecipePackage(id: string): Promise<RecipePackage | null> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE, "readonly");
    const request = transaction.objectStore(STORE).get(id);
    request.onsuccess = () => resolve((request.result as RecipePackage | undefined) ?? null);
    request.onerror = () => reject(request.error);
  });
}

export async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return null;
  return navigator.serviceWorker.register("/sw.js");
}

export interface QueuedOperation { id: string; kind: "cooking_complete"; payload: unknown; createdAt: string }
export async function enqueueOperation(operation: QueuedOperation) {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => { const transaction = database.transaction(OPERATIONS_STORE, "readwrite"); transaction.objectStore(OPERATIONS_STORE).put(operation); transaction.oncomplete = () => resolve(); transaction.onerror = () => reject(transaction.error); });
}
export async function pendingOperations(): Promise<QueuedOperation[]> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => { const transaction = database.transaction(OPERATIONS_STORE, "readonly"); const request = transaction.objectStore(OPERATIONS_STORE).getAll(); request.onsuccess = () => resolve(request.result as QueuedOperation[]); request.onerror = () => reject(request.error); });
}
export async function removeOperation(id: string) {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => { const transaction = database.transaction(OPERATIONS_STORE, "readwrite"); transaction.objectStore(OPERATIONS_STORE).delete(id); transaction.oncomplete = () => resolve(); transaction.onerror = () => reject(transaction.error); });
}
export async function markRecipePackageCompleted(id:string){const database=await openDatabase();const records=await new Promise<Array<RecipePackage&{completedAt?:string}>>((resolve,reject)=>{const transaction=database.transaction(STORE,"readonly");const request=transaction.objectStore(STORE).getAll();request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error)});const current=records.find(item=>item.id===id);if(!current)return;current.completedAt=new Date().toISOString();const completed=records.filter(item=>item.id!==id&&item.completedAt).sort((a,b)=>b.completedAt!.localeCompare(a.completedAt!));await new Promise<void>((resolve,reject)=>{const transaction=database.transaction(STORE,"readwrite");transaction.objectStore(STORE).put(current);for(const item of completed.slice(4))transaction.objectStore(STORE).delete(item.id);transaction.oncomplete=()=>resolve();transaction.onerror=()=>reject(transaction.error)})}
