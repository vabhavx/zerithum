import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { generateTaxReportCsv } from './logic/exportTax.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { taxYear } = await req.json();
    const year = taxYear || new Date().getFullYear();

    // Fetch transactions for the tax year
    const transactions = await base44.entities.RevenueTransaction.filter({
      user_id: user.id
    });

    // Fetch tax profile
    const taxProfiles = await base44.entities.TaxProfile.filter({
      user_id: user.id,
      tax_year: year
    });
    const taxProfile = taxProfiles[0] || null;

    const csv = generateTaxReportCsv(transactions, taxProfile, user, year);

    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename=tax_report_${year}.csv`
      }
    });

  } catch (error: any) {
    console.error('Tax report export error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
