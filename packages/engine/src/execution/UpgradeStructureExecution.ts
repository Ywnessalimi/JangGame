import { passive } from "@openfront/engine-api/Generals";
import { zNum, zPlayerRef, zRef } from "@openfront/engine-lib/snapshot/SnapshotType";
import { z } from "zod";
import { Execution, Game, Player, Unit } from "../game/Game";
import { execSnapshotType } from "../snapshot/ExecutionSnapshot";
import type { ExecRecord, SnapshotReader, SnapshotWriter } from "../snapshot/SnapshotContext";

/** Each purchased level takes the same time as a fresh structure. Bulk upgrades queue. */
export class UpgradeStructureExecution implements Execution {
  private structure: Unit | undefined;
  private mg: Game;
  private remainingTicks = 0;
  private active = false;
  private paid = 0n;
  constructor(private player: Player, private unitId: number, private amount = 1) {}
  init(mg: Game, _ticks: number): void {
    this.mg = mg;
    this.structure = mg.unit(this.unitId);
    this.startLevel();
  }
  private startLevel(): void {
    const unit = this.structure;
    if (!unit || this.amount <= 0 || !this.player.canUpgradeUnit(unit)) { this.active = false; return; }
    this.paid = this.mg.unitInfo(unit.type()).cost(this.mg, this.player);
    this.player.removeGold(this.paid);
    this.remainingTicks = Math.ceil((this.mg.unitInfo(unit.type()).constructionDuration ?? 0) * passive(this.player, "buildTime"));
    unit.setUpgradeProgress(this.mg.ticks(), this.remainingTicks);
    this.active = true;
    if (this.remainingTicks === 0) this.completeLevel();
  }
  private completeLevel(): void {
    const unit = this.structure!;
    unit.setUpgradeProgress(null);
    this.player.upgradeUnit(unit, true);
    this.paid = 0n;
    this.amount--;
    this.active = false;
    if (this.amount > 0) this.startLevel();
  }
  tick(_ticks: number): void {
    const unit = this.structure;
    if (!this.active || !unit) return;
    if (!unit.isActive() || unit.owner() !== this.player) {
      if (unit.isActive()) unit.setUpgradeProgress(null);
      this.player.addGold(this.paid, undefined, false);
      this.paid = 0n; this.active = false;
      return;
    }
    if (--this.remainingTicks <= 0) this.completeLevel();
  }
  isActive(): boolean { return this.active; }
  activeDuringSpawnPhase(): boolean { return false; }
  snapshot(w: SnapshotWriter): ExecRecord {
    return UpgradeStructureExecutionSnapshot.write({
      structure: this.structure ? w.unit(this.structure) : null,
      player: w.player(this.player), unitId: this.unitId, amount: this.amount,
      remainingTicks: this.remainingTicks, active: this.active, paid: this.paid,
    });
  }
  restoreSnapshot(s: UpgradeStructureState, r: SnapshotReader): void {
    this.mg = r.game;
    this.structure = s.structure === null ? undefined : r.unit(s.structure);
    this.player = r.player(s.player);
    this.unitId = s.unitId; this.amount = s.amount;
    this.remainingTicks = s.remainingTicks ?? 0; this.active = s.active ?? false; this.paid = s.paid ?? 0n;
    // Migrate saves made before upgrades had their own active-building state.
    if (this.active && this.structure?.isUnderConstruction()) {
      this.structure.setUnderConstruction(false);
      this.structure.setUpgradeProgress(this.mg.ticks(), this.remainingTicks);
    }
  }
}
const UpgradeStructureStateSchema = z.object({
  structure: zRef().nullable(), player: zPlayerRef(), unitId: zNum(), amount: zNum(),
  remainingTicks: zNum().optional(), active: z.boolean().optional(), paid: z.bigint().optional(),
});
type UpgradeStructureState = z.infer<typeof UpgradeStructureStateSchema>;
export const UpgradeStructureExecutionSnapshot = execSnapshotType({
  name: "UpgradeStructure", version: 1, schema: UpgradeStructureStateSchema, cls: () => UpgradeStructureExecution,
});
