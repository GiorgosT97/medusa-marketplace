import {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework"

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 7)
}

function titleToHandle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

/**
 * Appends a short random suffix to every new product handle so that multiple
 * vendors can create products with the same title without hitting the unique
 * handle constraint.
 */
export function uniqueProductHandle(
  req: MedusaRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction
): void {
  const body = req.body as any
  if (body) {
    const suffix = randomSuffix()
    if (body.handle) {
      body.handle = `${body.handle}-${suffix}`
    } else if (body.title) {
      body.handle = `${titleToHandle(body.title)}-${suffix}`
    }
  }
  next()
}
