import { describe, expect, it } from "vitest";
import {
  CPMI_STATUS_FLOW,
  CPMI_STATUS_LABELS,
  DOCUMENT_TYPE_LABELS,
  JOB_MATCH_STATUS_LABELS,
  REQUIRED_DOCUMENT_TYPES,
} from "./types";

describe("CPMI status", () => {
  it("gives every step in the flow a label", () => {
    for (const status of CPMI_STATUS_FLOW) {
      expect(CPMI_STATUS_LABELS[status], status).toBeTruthy();
    }
  });

  it("also labels the two terminal (non-flow) statuses", () => {
    expect(CPMI_STATUS_LABELS.tidak_lolos).toBeTruthy();
    expect(CPMI_STATUS_LABELS.mengundurkan_diri).toBeTruthy();
  });

  it("has no duplicate steps in the flow", () => {
    expect(new Set(CPMI_STATUS_FLOW).size).toBe(CPMI_STATUS_FLOW.length);
  });
});

describe("documents", () => {
  it("gives every required document type a label", () => {
    for (const type of REQUIRED_DOCUMENT_TYPES) {
      expect(DOCUMENT_TYPE_LABELS[type], type).toBeTruthy();
    }
  });
});

describe("job order matches", () => {
  it("labels every status_match value allowed by the database check constraint", () => {
    const dbConstraintValues = ["disarankan", "dipilih_cpmi", "diterima", "ditolak"] as const;
    for (const status of dbConstraintValues) {
      expect(JOB_MATCH_STATUS_LABELS[status], status).toBeTruthy();
    }
  });
});
