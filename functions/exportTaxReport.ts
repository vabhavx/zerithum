import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { exportTaxReportLogic } from './logic/exportTaxReportLogic.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body;
    try {
      body = await req.json();
      if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
      }
    } catch {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { taxYear } = body;
    const year = taxYear || new Date().getFullYear();

    const ctx = {
      listTransactions: (filter: any) => base44.entities.RevenueTransaction.filter(filter),
      listTaxProfiles: (filter: any) => base44.entities.TaxProfile.filter(filter)
    };

    const csv = await exportTaxReportLogic(ctx, user, year);

    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename=tax_report_${year}.csv`
      }
    });

  } catch (error: any) {
    console.error('Tax report export error:', error);
    return Response.json({ error: error.message || 'Unknown error' }, { status: 500 });
  }
});
