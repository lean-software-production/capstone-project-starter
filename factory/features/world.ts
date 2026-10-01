import { After, setWorldConstructor, setDefaultTimeout, World } from "@cucumber/cucumber";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

setDefaultTimeout(15_000);

export interface AgentConfig {
  plannerInProse?: boolean;
  doerInProse?: boolean;
  validatorInProse?: boolean;
  invalidLastVerdict?: boolean;
  validatorPrefix?: string;
  writeSentinel?: boolean;
  doerNoChanges?: boolean;
  validation?: "always" | "reject-first" | "never";
}

export class FactoryWorld extends World {
  workspace = "";
  codebase = "";
  factoryDir = "";
  seedPath = "";
  planPath = "";
  chosenAgent = "";
  fakeBin = "";
  callLog = "";
  configPath = "";
  useChosenAgent = true;
  missingDoer = false;
  attempts = 3;
  lens: string | undefined;
  output = "";
  exitCode: number | null = null;
  initialCommitCount = 0;
  agentConfig: AgentConfig = {};

  makeWorkspace(): void {
    this.workspace = mkdtempSync(join(tmpdir(), "lean-factory-"));
  }
}

setWorldConstructor(FactoryWorld);

After(function (this: FactoryWorld) {
  if (this.workspace) rmSync(this.workspace, { recursive: true, force: true });
});
