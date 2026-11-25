/**
 * Workflow Registry
 *
 * Central source of truth for all workflows.
 *
 * Strategy (BYOK):
 * - Every model native to the Krea API is offered for BYOK and routes through
 *   krea-api.ts (pass opts.apiKey). Wiring a new Krea model = one registry
 *   entry with the model path from https://www.krea.ai/docs/api-reference/.
 * - RunningHub is limited to the custom workflows already wired below
 *   (provider: 'rh'). New custom workflows not available on Krea are added
 *   when the user publishes the RH app and shares the endpoint node ids.
 *
 * To add a new workflow:
 * 1. Add entry below with provider + params
 * 2. Import { WORKFLOWS } and reference by key
 */

/** Friendly display names for image workflows (shown under generated images instead of LLM label) */
export const WORKFLOW_DISPLAY_NAMES: Record<string, string> = {
  krea2: 'Krea 2 Turbo',
  krea2Raw: 'Krea 2 Raw',
  krea2Edit: 'Krea 2 Edit',
  sketchToImage: 'Art to Real',
  imageToSketch: 'Line Art',
  flux2DevEdit: 'Flux 2 Dev Edit',
  extractorPlus: 'Extractor+',
  clothingExtraction: 'Extractor+',
  qwenImageReversePrompt: 'Qwen Reverse Prompt',
}

/** Alias map: LLM may output clothingExtraction but registry key is extractorPlus */
export const WORKFLOW_ALIASES: Record<string, string> = {
  clothingExtraction: 'extractorPlus',
  clothing_extraction: 'extractorPlus',
  extractClothing: 'extractorPlus',
  extract_clothing: 'extractorPlus',
  extract: 'extractorPlus',
}

export const WORKFLOWS = {
  /** Krea 2 Turbo — default text-to-image (fast design iteration). Clean RH workflow, no LLM instructions. */
  krea2: {
    provider: 'rh' as const,
    webappId: '2072445848017002498',
    description: 'Krea 2 Turbo — text-to-image (fast design iteration)',
    nodes: {
      prompt: { nodeId: '951', fieldName: 'text' },
      aspectRatio: { nodeId: '942', fieldName: 'aspect_ratio' },
      megapixels: { nodeId: '942', fieldName: 'megapixels' },
      seed: { nodeId: '960', fieldName: 'Value' },
    },
  },

  /** Krea 2 Medium — illustrations ($0.03) */
  krea2Medium: {
    provider: 'krea' as const,
    model: 'krea/krea-2/medium',
    description: 'Krea 2 Medium — expressive illustrations',
    requiresImage: false,
  },

  /** Krea 2 Large — photorealism ($0.06) */
  krea2Large: {
    provider: 'krea' as const,
    model: 'krea/krea-2/large',
    description: 'Krea 2 Large — expressive photorealism',
    requiresImage: false,
  },




  // ═══ RH custom ComfyUI workflows below ═══

  /** Sketch-to-photo generation — Qwen + Flux 2 Klein ("Art to Real") */
  sketchToImage: {
    provider: 'rh' as const,
    webappId: '2070990171759276034',
    description: 'Qwen + Flux 2 Klein — Art to Real (designers starting from hand sketches, Procreate, pencil & paper)',
    nodes: {
      image: { nodeId: '71', fieldName: 'image' },
    },
  },

  /** Extractor+ — multi-item clothing extraction */
  extractorPlus: {
    provider: 'rh' as const,
    webappId: '2071662900963532802',
    description: 'Extractor+ — clothing → flat-lay extraction (e-commerce, merchandise planning)',
    nodes: {
      image: { nodeId: '157', fieldName: 'image' },
      prompt: { nodeId: '203', fieldName: 'text' },
    },
  },

  /** Qwen 3 VQA — fashion item detection for Extractor+ (app 2089035730450857985, verified 2026-08-16). URL image in (node 6 'value'), instruction in (node 4 'prompt'), text out. */
  qwen3VqaDetect: {
    provider: 'rh' as const,
    webappId: '2089035730450857985',
    description: 'Qwen 3 VQA — fashion item detection (Extractor+)',
    urlInput: true,
    nodes: {
      url: { nodeId: '6', fieldName: 'value' },
      prompt: { nodeId: '4', fieldName: 'prompt' },
    },
  },

  /** Qwen 3 VQA — image reverse prompt. Same app as qwen3VqaDetect (2089035730450857985, verified 2026-08-16): URL in node 6 'value', instruction in node 4 'prompt', text out. urlInput: the app passes public image URLs straight through; local uploads are hosted to Cloudinary first so a real URL reaches the workflow. guidedPrompt: false — the flow auto-runs on image upload with the default instruction below. */
  qwenImageReversePrompt: {
    provider: 'rh' as const,
    webappId: '2089035730450857985',
    description: 'Reverse prompt — fashion-ready complex prompts from reference images (Qwen 3 VQA)',
    urlInput: true,
    outputType: 'text' as const,
    guidedPrompt: false,
    // Default instruction sent to node 4 when the user provides no text.
    guidedDefaultPrompt: 'You are a professional photographer and expert prompt writer. Write a detailed fashion image-generation prompt based on this image. Describe the garments, fabrics, styling, silhouette, lighting, and composition.',
    nodes: {
      image: { nodeId: '6', fieldName: 'value' },
      prompt: { nodeId: '4', fieldName: 'prompt' },
    },
  },

  /** SeedVR2 upscale — up to 4K resolution (≤ 3840px) */
  upscaleSeedVR2: {
    provider: 'rh' as const,
    webappId: '2074869938719911937',
    description: 'SeedVR2 upscale to 4K',
    apiType: 'ai-app-v2' as const,
    nodes: {
      image: { nodeId: '1', fieldName: 'image' },
      resolution: { nodeId: '20', fieldName: 'value' },
    },
  },

  /** SeedVR2 upscale — 4K to 6K resolution (> 3840px) */
  upscaleSeedVR2_6K: {
    provider: 'rh' as const,
    webappId: '2075107289849225218',
    description: 'SeedVR2 upscale 4K-6K',
    apiType: 'ai-app-v2' as const,
    nodes: {
      image: { nodeId: '1', fieldName: 'image' },
      resolution: { nodeId: '2', fieldName: 'value' },
    },
  },

  /** Flux 2 Dev — 2-image edit (reference + target) */
  flux2DevEdit: {
    provider: 'rh' as const,
    webappId: '2076145416936198145',
    description: 'Flux 2 Dev 2-image edit — transfer an already-generated style onto a model (style ref + target)',
    nodes: {
      image1: { nodeId: '46', fieldName: 'image' },
      image2: { nodeId: '42', fieldName: 'image' },
      prompt: { nodeId: '6', fieldName: 'text' },
    },
  },

  /** Krea2 Edit — single image edit with custom Edit Lora. Stays on RH until Lora is migrated to Krea API styles. */
  krea2Edit: {
    provider: 'rh' as const,
    webappId: '2076135733588496385',
    description: 'Krea2 single image edit (RH — custom Edit LoRA, turbo ideation edits)',
    apiType: 'ai-app-v2' as const,
    nodes: {
      image: { nodeId: '5', fieldName: 'image' },
      prompt: { nodeId: '23', fieldName: 'prompt' },
    },
  },

  /** Krea2 Style Reference — text-to-image with style reference, handled by Krea 2 AIO. Was RH webapp 2078735072841650178. */
  krea2StyleRef: {
    provider: 'krea' as const,
    model: 'krea/krea-2/medium-turbo',
    description: 'Krea2 style reference (AIO, turbo) — apply preset styles to an image (illustration for web graphics, invites)',
    requiresImage: true,
  },

  /** Krea2 ControlNet — Krea 2 with ControlNet guidance. Takes image + prompt, uses ControlNet to preserve composition */
  krea2ControlNet: {
    provider: 'rh' as const,
    webappId: '2078636997892591618',
    description: 'Krea 2 ControlNet — image-to-image with Nvidia Super Resolution upscale, seed support',
    nodes: {
      image: { nodeId: 'TODO', fieldName: 'TODO' },
      prompt: { nodeId: 'TODO', fieldName: 'TODO' },
      aspectRatio: { nodeId: 'TODO', fieldName: 'TODO' },
      seed: { nodeId: 'TODO', fieldName: 'TODO' },
    },
  },

  /** Krea2 Raw — SDXL-based HD text-to-image */
  krea2Raw: {
    provider: 'rh' as const,
    webappId: '2079426030997127169',
    description: 'Krea 2 Raw — SDXL-based HD text-to-image (photorealistic: social media, heroes, front-of-house)',
    apiType: 'ai-app-v2' as const,
    nodes: {
      prompt: { nodeId: '63', fieldName: 'value' },
      aspectRatio: { nodeId: '49', fieldName: 'aspect_ratio', fieldData: '[\"COMBO\", {\"default\": \"1:1 (Square)\", \"options\": [\"1:1 (Square)\", \"2:3 (Portrait Photo)\", \"3:2 (Photo)\", \"3:4 (Portrait Standard)\", \"4:3 (Standard)\", \"9:16 (Portrait Widescreen)\", \"16:9 (Widescreen)\", \"21:9 (Ultrawide)\"], \"tooltip\": \"The aspect ratio for the output dimensions.\", \"multiselect\": false}]' },
      megapixels: { nodeId: '49', fieldName: 'megapixels' },
    },
  },


  /** Seedance 2.0 — text/video-to-video generation. Was RH webapp 2077149558999875585; migrated to krea.ai. */
  seedance2: {
    provider: 'krea' as const,
    model: 'TODO',
    stub: true,
    description: 'TODO: confirm Seedance 2.0 model path on krea.ai',
  },


  /** Image to Line Sketch — Flux Klein LoRA for technical flat drawing */
  imageToSketch: {
    provider: 'rh' as const,
    webappId: '2078193907335647234',
    description: 'Image to Line Sketch — flat sketch for tech packs',
    nodes: {
      image: { nodeId: '16', fieldName: 'image' },
    },
    // The RH app only takes the image node, but the guided flow still collects
    // a prompt so the pattern matches other workflows (typed text is used for
    // the chat + asset record; the extra input is ignored by the executor).
    guidedPrompt: true,
  },

  // ═══ Un-routed stubs (in the workflow picker menu, no API yet) ═══
  // BYOK: Krea-native models below get routed via krea-api.ts when confirmed.
  // RH: models not on the Krea API need a published RH app + endpoint node ids.
  // Reference table: product/epics/64-claire-krea-routing-epic.md

  /** ChatGPT Image (first gen) — OpenAI original image model ($0.3747) */
  gptImage: {
    provider: 'krea' as const,
    model: 'openai/gpt-image',
    description: 'ChatGPT Image — original OpenAI image model',
    requiresImage: false,
  },

  /** Z-Image — Krea's fastest model ($0.003). Base variant still routes via RH webapp. */
  zImageTurbo: {
    provider: 'krea' as const,
    model: 'z-image/z-image',
    description: 'Z Image — fastest, realistic, low diversity',
    requiresImage: false,
  },

  /** Qwen 2512 — affordable medium quality ($0.0186). */
  qwen2512: {
    provider: 'krea' as const,
    model: 'qwen/2512',
    description: 'Qwen 2512 — affordable medium quality',
    requiresImage: false,
  },

  /** Seedream 5 Lite — up to 14 style refs ($0.0368). */
  seedream5Lite: {
    provider: 'krea' as const,
    model: 'bytedance/seedream-5-lite',
    description: 'Seedream 5 Lite — medium quality, many style refs',
    requiresImage: false,
  },

  /** Seedream 5 Pro — highest quality, precise editing ($0.0473+, +$0.0031/ref). */
  seedream5Pro: {
    provider: 'krea' as const,
    model: 'bytedance/seedream-5-pro',
    description: 'Seedream 5 Pro — highest quality, precise editing',
    requiresImage: false,
  },

  /** Flux 2 Klein (plain T2I) — Flux 2 is NOT on the Krea API; only exists inside sketchToImage (Art to Real) today. Needs an RH webapp. */
  flux2Klein: { provider: 'rh' as const, webappId: 'TODO', stub: true, description: 'TODO: create RH webapp for Flux 2 Klein T2I (not on Krea API)' },

  /** Flux 2 Dev (plain T2I) — Flux 2 is NOT on the Krea API; today only flux2DevEdit (2-image edit) is routed. Needs an RH webapp. */
  flux2Dev: { provider: 'rh' as const, webappId: 'TODO', stub: true, description: 'TODO: create RH webapp for Flux 2 Dev T2I (not on Krea API)' },

  /** Qwen 2511 — NOT on the Krea API (only 2512). Needs an RH webapp. */
  qwen2511: { provider: 'rh' as const, webappId: 'TODO', stub: true, description: 'TODO: create RH webapp for Qwen 2511 (not on Krea API)' },

  /** Wan 2.2 Text to Image — NOT on the Krea API (Wan video only). Needs an RH webapp. */
  wan22TextToImage: { provider: 'rh' as const, webappId: 'TODO', stub: true, description: 'TODO: create RH webapp for Wan 2.2 T2I (not on Krea API)' },

  /** Seedream 5 — NOT in the Krea API index (4, 5 Lite, 5 Pro are). Reuse seedream5Lite/Pro or confirm with Krea. */
  seedream5: { provider: 'krea' as const, model: 'TODO', stub: true, description: 'TODO: confirm Seedream 5 path on krea.ai (index has 5 Lite / 5 Pro)' },

  /** Ideogram 4 — NOT in the Krea API index (Ideogram 3.0 is: ideogram/ideogram-3). */
  ideogram4: { provider: 'krea' as const, model: 'TODO', stub: true, description: 'TODO: route Ideogram 4 to krea.ai (index has ideogram-3)' },

  /** Video models below are Krea-native (BYOK) - confirm the /generate/video/{path} from the API index before routing. */
  seedance2Mini: { provider: 'krea' as const, model: 'TODO', stub: true, description: 'TODO: confirm Seedance 2.0 Mini video path on krea.ai' },

  /** Seedance Pro Fast — picker item, no route yet. */
  seedanceProFast: { provider: 'krea' as const, model: 'TODO', stub: true, description: 'TODO: confirm Seedance Pro Fast video path on krea.ai' },

  /** Veo 3.1 Fast — picker item, no route yet. */
  veo31Fast: { provider: 'krea' as const, model: 'TODO', stub: true, description: 'TODO: confirm Veo 3.1 Fast video path on krea.ai' },

  /** Veo 3.1 Lite — picker item, no route yet. */
  veo31Lite: { provider: 'krea' as const, model: 'TODO', stub: true, description: 'TODO: confirm Veo 3.1 Lite video path on krea.ai' },

  /** Wan 2.2 (video) — picker item, no route yet. */
  wan22Video: { provider: 'rh' as const, webappId: 'TODO', stub: true, description: 'TODO: create RH webapp for Wan 2.2 video' },

  /** Minimax H3 — picker item, no route yet. */
  minimaxH3: { provider: 'rh' as const, webappId: 'TODO', stub: true, description: 'TODO: create RH webapp for Minimax H3' },

  /** Kling 03 — picker item, no route yet. */
  kling03: { provider: 'rh' as const, webappId: 'TODO', stub: true, description: 'TODO: create RH webapp for Kling 03' },

  /** SCAIL2 — picker item, no route yet. */
  scail2: { provider: 'rh' as const, webappId: 'TODO', stub: true, description: 'TODO: create RH webapp for SCAIL2' },
} as const

/** Check if a workflow uses Krea API (vs RH custom workflow) */
export function isKreaWorkflow(name: keyof typeof WORKFLOWS): boolean {
  return WORKFLOWS[name].provider === 'krea'
}

/** Check if a workflow is a RunningHub custom workflow. */
export function isRhWorkflow(name: WorkflowId): boolean {
  return WORKFLOWS[name].provider === 'rh'
}

/** Get the Krea model path for a Krea-native workflow. Throws if RH workflow. */
export function kreaModel(name: keyof typeof WORKFLOWS): string {
  const wf = WORKFLOWS[name]
  if (wf.provider !== 'krea') throw new Error(`${name} is not a Krea workflow`)
  return wf.model
}

/** Convenience: get webapp ID by workflow name (RH workflows only). */
export function webappId(name: keyof typeof WORKFLOWS): string {
  const wf = WORKFLOWS[name]
  if (wf.provider !== 'rh') throw new Error(`${name} is a Krea workflow, not RH`)
  return wf.webappId
}

/** All valid workflow IDs. */
export type WorkflowId = keyof typeof WORKFLOWS

/** True when a workflow is a stub (picker item with no API route yet). */
export function isStubWorkflow(name: WorkflowId): boolean {
  return 'stub' in WORKFLOWS[name] && WORKFLOWS[name].stub === true
}

/**
 * True when a workflow is confirmed working: not a stub, has a real Krea
 * model path (no 'TODO') or a real RH webappId (no 'TODO') with no 'TODO'
 * node ids. Used to curate the manual workflow picker to working items only.
 */
export function isConfirmedWorkflow(name: WorkflowId): boolean {
  if (isStubWorkflow(name)) return false
  const wf = WORKFLOWS[name]
  if (wf.provider === 'krea') {
    return 'model' in wf && wf.model !== 'TODO'
  }
  // RH workflow — real webappId + no TODO node ids
  if (wf.webappId === 'TODO') return false
  if ('nodes' in wf) {
    for (const node of Object.values(wf.nodes)) {
      if (node.nodeId === 'TODO') return false
    }
  }
  return true
}

/**
 * Input spec for the guided chat flow: how many images the workflow needs and
 * whether it takes a text prompt. Derived from the registry entry.
 */
export function workflowInputSpec(workflowId: WorkflowId): { images: number; prompt: boolean } {
  const wf = WORKFLOWS[workflowId]
  if ('requiresImage' in wf && typeof wf.requiresImage === 'boolean') {
    // Krea-native entries: image count from requiresImage, prompt always via model.
    return {
      images: wf.requiresImage ? 1 : 0,
      prompt: 'model' in wf,
    }
  }
  if ('nodes' in wf) {
    const keys = Object.keys(wf.nodes)
    // guidedPrompt explicitly overrides the node-derived requirement: true forces
    // a prompt step (imageToSketch), false auto-runs on image upload (reverse prompt).
    const guided = (wf as { guidedPrompt?: boolean }).guidedPrompt
    return {
      images: keys.filter(k => k.toLowerCase().includes('image')).length,
      prompt: guided !== undefined ? guided : keys.includes('prompt'),
    }
  }
  return { images: 0, prompt: true }
}
