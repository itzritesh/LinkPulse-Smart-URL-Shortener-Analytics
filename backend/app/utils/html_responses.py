"""HTML response templates for LinkPulse visitor error states."""
from typing import Optional
from fastapi.responses import HTMLResponse


def render_error_page(
    status_code: int,
    badge_label: str,
    badge_variant: str,
    title: str,
    heading: str,
    description: str,
    short_code: Optional[str] = None,
    home_url: str = "/",
) -> HTMLResponse:
    """Generates a responsive, branded LinkPulse HTML error page for browser visitors."""

    # Badge styling variants
    variant_styles = {
        "rose": {
            "bg": "rgba(244, 63, 94, 0.12)",
            "border": "rgba(244, 63, 94, 0.35)",
            "text": "#fb7185",
            "glow": "rgba(244, 63, 94, 0.25)",
            "icon": """<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>""",
        },
        "amber": {
            "bg": "rgba(245, 158, 11, 0.12)",
            "border": "rgba(245, 158, 11, 0.35)",
            "text": "#fbbf24",
            "glow": "rgba(245, 158, 11, 0.25)",
            "icon": """<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>""",
        },
        "violet": {
            "bg": "rgba(139, 92, 246, 0.12)",
            "border": "rgba(139, 92, 246, 0.35)",
            "text": "#a78bfa",
            "glow": "rgba(139, 92, 246, 0.25)",
            "icon": """<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>""",
        },
    }

    style = variant_styles.get(badge_variant, variant_styles["violet"])
    code_display = f'<div class="code-pill"><code>/{short_code}</code></div>' if short_code else ""

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{title} — LinkPulse</title>
  <style>
    *, *::before, *::after {{
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }}
    body {{
      min-height: 100vh;
      background-color: #020617;
      background-image:
        radial-gradient(ellipse at 50% 10%, rgba(99, 102, 241, 0.15), transparent 60%),
        radial-gradient(circle at 80% 80%, {style['glow']}, transparent 50%);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #f8fafc;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
      overflow-x: hidden;
    }}
    .card {{
      max-width: 520px;
      width: 100%;
      background: rgba(15, 23, 42, 0.85);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(51, 65, 85, 0.6);
      border-radius: 1.5rem;
      padding: 2.5rem 2rem;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 40px -10px {style['glow']};
      text-align: center;
      animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    }}
    @keyframes fadeIn {{
      from {{ opacity: 0; transform: translateY(16px); }}
      to {{ opacity: 1; transform: translateY(0); }}
    }}
    .icon-wrapper {{
      width: 64px;
      height: 64px;
      border-radius: 1rem;
      background: {style['bg']};
      border: 1px solid {style['border']};
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1.5rem;
    }}
    .badge {{
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.3rem 0.85rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      background: {style['bg']};
      color: {style['text']};
      border: 1px solid {style['border']};
      margin-bottom: 1rem;
    }}
    h1 {{
      font-size: 1.75rem;
      font-weight: 800;
      color: #ffffff;
      line-height: 1.25;
      margin-bottom: 0.75rem;
    }}
    p {{
      font-size: 0.95rem;
      color: #94a3b8;
      line-height: 1.6;
      margin-bottom: 1.5rem;
    }}
    .code-pill {{
      display: inline-block;
      padding: 0.35rem 0.75rem;
      background: rgba(30, 41, 59, 0.8);
      border: 1px solid rgba(71, 85, 105, 0.6);
      border-radius: 0.5rem;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 0.85rem;
      color: #cbd5e1;
      margin-bottom: 1.5rem;
    }}
    .actions {{
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }}
    .btn {{
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      width: 100%;
      padding: 0.85rem 1.25rem;
      border-radius: 0.75rem;
      font-size: 0.9rem;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.2s ease;
      cursor: pointer;
    }}
    .btn-primary {{
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      color: #ffffff;
      box-shadow: 0 4px 14px rgba(99, 102, 241, 0.35);
    }}
    .btn-primary:hover {{
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(99, 102, 241, 0.5);
    }}
    .brand {{
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      margin-top: 2rem;
      font-size: 0.8rem;
      color: #64748b;
    }}
    .brand svg {{
      width: 16px;
      height: 16px;
      color: #8b5cf6;
    }}
  </style>
</head>
<body>
  <div class="card">
    <div class="icon-wrapper">
      {style['icon']}
    </div>
    <div>
      <span class="badge">{badge_label}</span>
    </div>
    <h1>{heading}</h1>
    <p>{description}</p>
    {code_display}
    <div class="actions">
      <a href="{home_url}" class="btn btn-primary">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        Return to LinkPulse
      </a>
    </div>
    <div class="brand">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
      <span>Powered by <strong>LinkPulse</strong></span>
    </div>
  </div>
</body>
</html>
"""
    return HTMLResponse(content=html_content, status_code=status_code)
