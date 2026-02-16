
export interface EmailLayoutProps {
  title: string;
  content: string;
  footerContent?: string;
  headerGradient?: { from: string; to: string };
  additionalStyles?: string;
}

export function renderEmailLayout(props: EmailLayoutProps): string {
  const {
    title,
    content,
    footerContent,
    headerGradient = { from: '#f97316', to: '#ea580c' }, // Default orange
    additionalStyles = ''
  } = props;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; }
    .header { background: linear-gradient(135deg, ${headerGradient.from} 0%, ${headerGradient.to} 100%); padding: 30px 20px; text-align: center; border-radius: 12px 12px 0 0; }
    .header h1 { color: white; margin: 0; font-size: 24px; }
    .content { background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }

    /* Additional Styles */
    ${additionalStyles}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${title}</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      ${footerContent || 'This is an automated email from Zerithum.'}
    </div>
  </div>
</body>
</html>
`;
}
