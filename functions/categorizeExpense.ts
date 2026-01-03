import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { description, merchant, amount, receiptUrl } = await req.json();

    if (!description && !merchant) {
      return Response.json({ error: 'Description or merchant required' }, { status: 400 });
    }

    // Use AI to categorize the expense
    const prompt = `Analyze this business expense and categorize it. Also determine if it's tax deductible and what percentage.

Expense details:
${merchant ? `Merchant: ${merchant}` : ''}
${description ? `Description: ${description}` : ''}
${amount ? `Amount: $${amount}` : ''}

Available categories:
- software_subscriptions (software, tools, SaaS)
- equipment (computers, cameras, hardware)
- marketing (ads, promotions, content creation)
- professional_services (accountants, lawyers, consultants)
- office_supplies (supplies, materials)
- travel (business travel, transportation)
- education (courses, books, training)
- internet_phone (internet, phone bills)
- rent_utilities (office rent, utilities)
- other (misc expenses)

Tax deductibility guidelines:
- 100% deductible: Software, equipment, marketing, professional services, office supplies, education
- Partial deductible: Travel (depends on purpose), internet/phone (if mixed use)
- Context dependent: Meals (50%), entertainment (varies)

Provide categorization with confidence level.`;

    const fileUrls = receiptUrl ? [receiptUrl] : undefined;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      file_urls: fileUrls,
      response_json_schema: {
        type: "object",
        properties: {
          category: {
            type: "string",
            enum: [
              "software_subscriptions",
              "equipment",
              "marketing",
              "professional_services",
              "office_supplies",
              "travel",
              "education",
              "internet_phone",
              "rent_utilities",
              "other"
            ]
          },
          is_tax_deductible: { type: "boolean" },
          deduction_percentage: { type: "number" },
          confidence: { type: "number" },
          reasoning: { type: "string" }
        }
      }
    });

    return Response.json({
      success: true,
      category: result.category,
      is_tax_deductible: result.is_tax_deductible,
      deduction_percentage: result.deduction_percentage,
      confidence: result.confidence,
      reasoning: result.reasoning
    });

  } catch (error) {
    console.error('Categorization error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});