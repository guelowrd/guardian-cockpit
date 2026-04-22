export interface ContainerMeta {
  id: string;
  startedAt: string;
}

export async function getContainerMeta(): Promise<ContainerMeta | null> {
  const name = process.env.DOCKER_CONTAINER_NAME;
  if (!name) return null;
  try {
    const Docker = (await import("dockerode")).default;
    const docker = new Docker();
    const container = docker.getContainer(name);
    const info = await container.inspect();
    return {
      id: info.Id.slice(0, 12),
      startedAt: info.State.StartedAt,
    };
  } catch {
    return null;
  }
}
