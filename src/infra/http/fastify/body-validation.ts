import type { FastifyInstance, FastifySchemaCompiler } from "fastify";
import AjvCompiler from "@fastify/ajv-compiler";
import AppError from "../../../core/appError.js";

/** Use Fastify's own compiler. Body strictness does not change URL query coercion. */
export function configureBodyValidation(
  fastify: FastifyInstance,
  messages: {
    extraField: (field: string) => string;
    invalidType: string;
  },
) {
  const build = AjvCompiler();
  fastify.setValidatorCompiler((options) => {
    const compile = build(fastify.getSchemas() as Parameters<typeof build>[0], {
      customOptions: {
        coerceTypes: options.httpPart === "body" ? false : "array",
        removeAdditional: options.httpPart !== "body",
        useDefaults: true,
      },
    }) as FastifySchemaCompiler<unknown>;
    return compile(options);
  });
  fastify.setSchemaErrorFormatter((errors, part) => {
    const first = errors[0];
    if (part === "body" && first?.keyword === "additionalProperties")
      return new AppError(
        messages.extraField(String(first.params.additionalProperty)),
        400,
      );
    if (part === "body" && first?.keyword === "type")
      return new AppError(messages.invalidType, 400);
    return new Error(
      errors
        .map((error) => part + (error.instancePath || "") + " " + error.message)
        .join(", "),
    );
  });
}
