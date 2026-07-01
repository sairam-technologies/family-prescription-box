import { Card } from "@/components/ui/Card";

export function DbSetupNotice({ feature }: { feature: string }) {
  return (
    <Card className="border-amber-200 bg-amber-50">
      <p className="font-medium text-amber-900">Database setup required</p>
      <p className="mt-2 text-sm text-amber-800">
        The {feature} tables are not in your database yet. Run this once against
        your Neon database, then redeploy:
      </p>
      <pre className="mt-3 overflow-x-auto rounded-lg bg-white px-3 py-2 text-sm text-slate-800">
        npx prisma db push
      </pre>
    </Card>
  );
}
