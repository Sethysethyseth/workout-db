/**
 * Any-AI instructions, example, and JSON Schema for LogChamp Block Format v1.
 * Spec: docs/specs/blocks-v2.md section 3.4.
 */

const BLOCK_FORMAT_AI_INSTRUCTIONS = `LogChamp Block Format v1 — reply with ONLY the JSON in one code block.

Top-level fields:
- format: exactly "logchamp.block"
- version: exactly 1
- name: string, 1-120 chars
- description: optional string, max 2000
- unit: optional "lb" or "kg" (the unit your weights are in)
- effort: optional "rpe", "rir", or "none" (pick one scale for the whole block)
- weeks: array of 1-52 weeks

Each week: optional label (max 40), required days (1-14).
Each day: required name (1-60), required exercises (1-40).
Each exercise: required name (1-120); optional notes (max 1000), restSec (0-3600), effortCap (boolean).
sets: EITHER an integer 1-20 (uniform shorthand — put reps/weight/rpe on the exercise) OR an array of 1-20 set objects (then set fields only inside each set).

Set fields: reps (>0), repsMax (>reps), durationSec (1-3600 timed set), weight (>0, max 2000), rpe (1-10, steps of 0.5), rir (integer 0-10).
Rules: reps and durationSec never both; omit weight for bodyweight, never 0; use RPE or RIR, not both; unknown keys are rejected.
effortCap true means each set's rpe is a ceiling / rir a floor.
A rep range like 8-12 is reps: 8, repsMax: 12. Timed work uses durationSec (seconds).`;

const BLOCK_FORMAT_EXAMPLE = {
  format: "logchamp.block",
  version: 1,
  name: "Sample Upper",
  unit: "lb",
  effort: "rpe",
  weeks: [
    {
      days: [
        {
          name: "Day A",
          exercises: [
            {
              name: "Bench Press",
              restSec: 120,
              sets: [
                { reps: 5, weight: 185, rpe: 8 },
                { reps: 5, weight: 185, rpe: 8 },
              ],
            },
            {
              name: "Plank",
              sets: 2,
              durationSec: 30,
            },
          ],
        },
      ],
    },
  ],
};

const BLOCK_FORMAT_JSON_SCHEMA = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://logchamp.app/schemas/block-format-v1.json",
  title: "LogChamp Block Format v1",
  type: "object",
  additionalProperties: false,
  required: ["format", "version", "name", "weeks"],
  properties: {
    format: { const: "logchamp.block" },
    version: { const: 1 },
    name: { type: "string", minLength: 1, maxLength: 120 },
    description: { type: "string", maxLength: 2000 },
    unit: { type: "string", enum: ["lb", "kg"] },
    effort: { type: "string", enum: ["rpe", "rir", "none"] },
    weeks: {
      type: "array",
      minItems: 1,
      maxItems: 52,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["days"],
        properties: {
          label: { type: "string", maxLength: 40 },
          days: {
            type: "array",
            minItems: 1,
            maxItems: 14,
            items: {
              type: "object",
              additionalProperties: false,
              required: ["name", "exercises"],
              properties: {
                name: { type: "string", minLength: 1, maxLength: 60 },
                exercises: {
                  type: "array",
                  minItems: 1,
                  maxItems: 40,
                  items: {
                    type: "object",
                    additionalProperties: false,
                    required: ["name", "sets"],
                    properties: {
                      name: { type: "string", minLength: 1, maxLength: 120 },
                      notes: { type: "string", maxLength: 1000 },
                      restSec: { type: "integer", minimum: 0, maximum: 3600 },
                      effortCap: { type: "boolean" },
                      sets: {
                        oneOf: [
                          { type: "integer", minimum: 1, maximum: 20 },
                          {
                            type: "array",
                            minItems: 1,
                            maxItems: 20,
                            items: { $ref: "#/$defs/set" },
                          },
                        ],
                      },
                      reps: { type: "number", exclusiveMinimum: 0, maximum: 1000 },
                      repsMax: { type: "number", exclusiveMinimum: 0, maximum: 1000 },
                      durationSec: {
                        type: "integer",
                        minimum: 1,
                        maximum: 3600,
                      },
                      weight: {
                        type: "number",
                        exclusiveMinimum: 0,
                        maximum: 2000,
                      },
                      rpe: { type: "number", minimum: 1, maximum: 10 },
                      rir: { type: "integer", minimum: 0, maximum: 10 },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  $defs: {
    set: {
      type: "object",
      additionalProperties: false,
      properties: {
        reps: { type: "number", exclusiveMinimum: 0, maximum: 1000 },
        repsMax: { type: "number", exclusiveMinimum: 0, maximum: 1000 },
        durationSec: { type: "integer", minimum: 1, maximum: 3600 },
        weight: { type: "number", exclusiveMinimum: 0, maximum: 2000 },
        rpe: { type: "number", minimum: 1, maximum: 10 },
        rir: { type: "integer", minimum: 0, maximum: 10 },
      },
    },
  },
};

module.exports = {
  BLOCK_FORMAT_AI_INSTRUCTIONS,
  BLOCK_FORMAT_EXAMPLE,
  BLOCK_FORMAT_JSON_SCHEMA,
};
