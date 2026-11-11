export const roboflowModels = [
  {
    id: "chili-classification",
    label: "Chili classification",
    kind: "Classification",
    envName: "ROBOFLOW_MODEL_ID",
    defaultModelId: "chili-classification-5ohkl/9",
  },
  {
    id: "flower-segmentation",
    label: "Flower segmentation",
    kind: "Segmentation",
    envName: "ROBOFLOW_FLOWER_SEGMENTATION_MODEL_ID",
    defaultModelId: "",
  },
  {
    id: "chili-segmentation",
    label: "Chili segmentation",
    kind: "Segmentation",
    envName: "ROBOFLOW_CHILI_SEGMENTATION_MODEL_ID",
    defaultModelId: "",
  },
  {
    id: "chili-maturity-classifier",
    label: "Chili maturity classifier",
    kind: "Classification",
    envName: "ROBOFLOW_CHILI_MATURITY_MODEL_ID",
    defaultModelId: "",
  },
] as const;

export type RoboflowModelId = (typeof roboflowModels)[number]["id"];

export function isRoboflowModelId(value: unknown): value is RoboflowModelId {
  return roboflowModels.some((model) => model.id === value);
}

export function getRoboflowModel(modelId: RoboflowModelId) {
  const definition = roboflowModels.find((model) => model.id === modelId);
  if (!definition) {
    throw new Error(`Unknown Roboflow model: ${modelId}`);
  }

  const configuredId = process.env[definition.envName]?.trim();
  const resolvedId = configuredId || definition.defaultModelId;
  const validId = /^[^/]+\/\d+$/.test(resolvedId);

  return {
    ...definition,
    modelId: validId ? resolvedId : "",
    configured: validId,
  };
}

export function getRoboflowModelOptions() {
  return roboflowModels.map(({ id, label, kind, envName }) => ({
    id,
    label,
    kind,
    envName,
    configured: getRoboflowModel(id).configured,
  }));
}
