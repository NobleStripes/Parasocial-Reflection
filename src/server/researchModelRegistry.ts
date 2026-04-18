import fs from "node:fs";
import path from "node:path";

import {
  getPsychiatricResearchModel,
  type PsychiatricResearchModel,
  type PsychiatricResearchRegistry,
} from "../shared/psychiatricResearch";

function getRegistryPath(): string {
  return process.env.RESEARCH_MODELS_FILE || path.resolve(process.cwd(), "config", "research-models.json");
}

function isValidRegistry(value: unknown): value is PsychiatricResearchRegistry {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as PsychiatricResearchRegistry;
  return Array.isArray(candidate.models) && candidate.models.length > 0;
}

function loadRegistryFromDisk(): PsychiatricResearchRegistry {
  const filePath = getRegistryPath();

  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const parsed = JSON.parse(raw) as unknown;

    if (isValidRegistry(parsed)) {
      return parsed;
    }
  } catch {
    // fallback below
  }

  return {
    schemaVersion: "1",
    models: [getPsychiatricResearchModel()],
  };
}

export function listConfiguredResearchModels(): PsychiatricResearchModel[] {
  return loadRegistryFromDisk().models;
}

export function resolveConfiguredResearchModel(requestedId?: string): PsychiatricResearchModel {
  const models = listConfiguredResearchModels();
  const pinnedId = requestedId || process.env.RESEARCH_MODEL_ID;

  if (!pinnedId) {
    return models[0];
  }

  return models.find((model) => model.id === pinnedId) || models[0];
}
