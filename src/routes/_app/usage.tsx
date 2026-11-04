import { createFileRoute } from '@tanstack/react-router';
import { AccessDenied, PermissionsUnavailable } from '@/components/shared';
import { SystemCapabilities } from '@/constants';
import { UsagePage } from '@/components/usage';
import { useCapabilities } from '@/hooks';

export const Route = createFileRoute('/_app/usage')({
  component: UsageRoute,
});

function UsageRoute() {
  const { hasCapability, isLoading, isError } = useCapabilities();

  if (isLoading) return null;
  if (isError) return <PermissionsUnavailable />;
  if (!hasCapability(SystemCapabilities.READ_USAGE)) return <AccessDenied />;

  return <UsagePage />;
}
