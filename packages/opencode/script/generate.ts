import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dir = path.resolve(__dirname, "..")

process.chdir(dir)

const modelsUrl = process.env.OPENCODE_MODELS_URL || "https://models.dev"
// 离线回退：网络获取失败时使用本地缓存快照（由有外网的机器预下载）
const offlineSnapshot = path.resolve(dir, "../../offline-cache/models/api.json")

async function loadModelsData(): Promise<string> {
  if (process.env.MODELS_DEV_API_JSON) return await Bun.file(process.env.MODELS_DEV_API_JSON).text()
  try {
    return await fetch(`${modelsUrl}/api.json`).then((x) => x.text())
  } catch {
    if (fs.existsSync(offlineSnapshot)) {
      console.log(`Using offline models.dev snapshot: ${offlineSnapshot}`)
      return await Bun.file(offlineSnapshot).text()
    }
    throw new Error(
      `Unable to fetch ${modelsUrl}/api.json and no offline snapshot found at ${offlineSnapshot}. ` +
        `Download it on a machine with internet access and place it at offline-cache/models/api.json, ` +
        `or set MODELS_DEV_API_JSON to a local file path.`,
    )
  }
}

export const modelsData = await loadModelsData()
console.log("Loaded models.dev snapshot")
