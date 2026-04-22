import si from "systeminformation";

export interface SystemSnapshot {
  cpu: { load: number };
  memory: { used: number; total: number; percent: number };
  network: { rxSec: number; txSec: number };
  uptime: number;
}

export async function getSystemSnapshot(): Promise<SystemSnapshot> {
  const [load, mem, nets] = await Promise.all([
    si.currentLoad(),
    si.mem(),
    si.networkStats(),
  ]);

  const net = nets[0] ?? { rx_sec: 0, tx_sec: 0 };
  return {
    cpu: { load: Math.round(load.currentLoad * 10) / 10 },
    memory: {
      used: mem.used,
      total: mem.total,
      percent: Math.round((mem.used / mem.total) * 1000) / 10,
    },
    network: {
      rxSec: Math.max(0, net.rx_sec ?? 0),
      txSec: Math.max(0, net.tx_sec ?? 0),
    },
    uptime: si.time().uptime,
  };
}
