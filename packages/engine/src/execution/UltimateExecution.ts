import { z } from "zod";
import { zPlayerRef } from "@openfront/engine-lib/snapshot/SnapshotType";
import { Execution, Game, Player } from "../game/Game";
import { execSnapshotType } from "../snapshot/ExecutionSnapshot";
import type { SnapshotReader, SnapshotWriter } from "../snapshot/SnapshotContext";
export class UltimateExecution implements Execution {
  constructor(private player: Player) {}
  init(_game: Game, _ticks: number): void { this.player.activateUltimate(); }
  tick(_ticks: number): void {}
  isActive(): boolean { return false; }
  activeDuringSpawnPhase(): boolean { return false; }
  snapshot(w: SnapshotWriter) { return UltimateExecutionSnapshot.write({ player: w.player(this.player) }); }
  restoreSnapshot(s: { player: number }, r: SnapshotReader): void { this.player = r.player(s.player); }
}
export const UltimateExecutionSnapshot = execSnapshotType({
  name: "Ultimate", version: 1,
  schema: z.object({ player: zPlayerRef() }), cls: () => UltimateExecution,
});
