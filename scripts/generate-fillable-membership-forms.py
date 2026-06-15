from pathlib import Path

from PIL import Image, ImageChops
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas


ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = ROOT / "public" / "forms"
SOURCE_LOGO = ROOT / "public" / "bonu-logo.jpg"
PREPARED_LOGO = OUTPUT_DIR / "bonu-logo-clean.png"

PAGE_WIDTH, PAGE_HEIGHT = A4
MARGIN = 42
BLUE = colors.HexColor("#078CAA")
DEEP_BLUE = colors.HexColor("#0B4D5B")
LIGHT_BLUE = colors.HexColor("#E8F6F8")
ORANGE = colors.HexColor("#F68724")
TEXT = colors.HexColor("#17323A")
MUTED = colors.HexColor("#526A72")
LINE = colors.HexColor("#A9C8CE")


def prepare_logo() -> None:
    image = Image.open(SOURCE_LOGO).convert("RGB")
    background = Image.new("RGB", image.size, "white")
    difference = ImageChops.difference(image, background)
    box = difference.getbbox()
    if box:
        image = image.crop(box)
    image.thumbnail((900, 900), Image.Resampling.LANCZOS)
    image.save(PREPARED_LOGO, quality=95)


def new_canvas(filename: str, title: str) -> canvas.Canvas:
    target = OUTPUT_DIR / filename
    pdf = canvas.Canvas(str(target), pagesize=A4)
    pdf.setTitle(title)
    pdf.setAuthor("Botswana Nurses Union")
    pdf.setSubject("Fillable BONU membership form")
    pdf.setCreator("Botswana Nurses Union Member Services Platform")
    return pdf


def header(pdf: canvas.Canvas, title: str, subtitle: str = "Complete electronically or in clear block letters") -> float:
    pdf.setFillColor(colors.white)
    pdf.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, fill=1, stroke=0)
    pdf.setFillColor(LIGHT_BLUE)
    pdf.rect(0, PAGE_HEIGHT - 118, PAGE_WIDTH, 118, fill=1, stroke=0)
    pdf.setFillColor(BLUE)
    pdf.rect(0, PAGE_HEIGHT - 124, PAGE_WIDTH, 6, fill=1, stroke=0)
    pdf.drawImage(str(PREPARED_LOGO), MARGIN, PAGE_HEIGHT - 100, width=58, height=58, preserveAspectRatio=True, mask="auto")
    pdf.setFillColor(DEEP_BLUE)
    pdf.setFont("Helvetica-Bold", 15)
    pdf.drawString(112, PAGE_HEIGHT - 52, "BOTSWANA NURSES UNION")
    pdf.setFont("Helvetica", 8.5)
    pdf.setFillColor(MUTED)
    pdf.drawString(112, PAGE_HEIGHT - 68, "Phiri Crescent, Ext 9, Plot 2684, Gaborone, Botswana")
    pdf.drawString(112, PAGE_HEIGHT - 82, "Tel: 395 3840  |  Email: info@bonu.org.bw  |  WhatsApp: +267 76 042 587")
    pdf.setFillColor(DEEP_BLUE)
    pdf.setFont("Helvetica-Bold", 17)
    pdf.drawString(MARGIN, PAGE_HEIGHT - 154, title)
    pdf.setFillColor(MUTED)
    pdf.setFont("Helvetica", 8.5)
    pdf.drawString(MARGIN, PAGE_HEIGHT - 169, subtitle)
    return PAGE_HEIGHT - 194


def footer(pdf: canvas.Canvas, page_number: int, note: str = "Botswana Nurses Union") -> None:
    pdf.setStrokeColor(LINE)
    pdf.line(MARGIN, 30, PAGE_WIDTH - MARGIN, 30)
    pdf.setFillColor(MUTED)
    pdf.setFont("Helvetica", 7.5)
    pdf.drawString(MARGIN, 18, note)
    pdf.drawRightString(PAGE_WIDTH - MARGIN, 18, f"Page {page_number}")


def section(pdf: canvas.Canvas, y: float, title: str, note: str | None = None) -> float:
    pdf.setFillColor(DEEP_BLUE)
    pdf.roundRect(MARGIN, y - 20, PAGE_WIDTH - 2 * MARGIN, 24, 4, fill=1, stroke=0)
    pdf.setFillColor(colors.white)
    pdf.setFont("Helvetica-Bold", 10)
    pdf.drawString(MARGIN + 10, y - 12, title)
    y -= 31
    if note:
        pdf.setFillColor(MUTED)
        pdf.setFont("Helvetica", 7.5)
        pdf.drawString(MARGIN, y, note)
        y -= 14
    return y


def text_field(
    pdf: canvas.Canvas,
    name: str,
    label: str,
    x: float,
    y: float,
    width: float,
    height: float = 20,
    required: bool = False,
    multiline: bool = False,
    font_size: float = 9,
) -> None:
    pdf.setFillColor(TEXT)
    pdf.setFont("Helvetica-Bold", 7.5)
    pdf.drawString(x, y + height + 3, f"{label}{' *' if required else ''}")
    flags = "multiline" if multiline else ""
    pdf.acroForm.textfield(
        name=name,
        tooltip=label,
        x=x,
        y=y,
        width=width,
        height=height,
        borderStyle="solid",
        borderColor=LINE,
        fillColor=colors.white,
        textColor=TEXT,
        forceBorder=True,
        fontName="Helvetica",
        fontSize=font_size,
        fieldFlags=flags,
    )


def checkbox(pdf: canvas.Canvas, name: str, label: str, x: float, y: float) -> None:
    pdf.acroForm.checkbox(
        name=name,
        tooltip=label,
        x=x,
        y=y,
        size=12,
        buttonStyle="check",
        borderColor=LINE,
        fillColor=colors.white,
        textColor=BLUE,
        forceBorder=True,
    )
    pdf.setFillColor(TEXT)
    pdf.setFont("Helvetica", 8.5)
    pdf.drawString(x + 17, y + 2, label)


def wrapped_text(pdf: canvas.Canvas, text: str, x: float, y: float, width: float, leading: float = 11) -> float:
    words = text.split()
    line = ""
    pdf.setFont("Helvetica", 8.5)
    pdf.setFillColor(TEXT)
    for word in words:
        candidate = f"{line} {word}".strip()
        if pdf.stringWidth(candidate, "Helvetica", 8.5) <= width:
            line = candidate
        else:
            pdf.drawString(x, y, line)
            y -= leading
            line = word
    if line:
        pdf.drawString(x, y, line)
        y -= leading
    return y


def person_table(
    pdf: canvas.Canvas,
    y: float,
    prefix: str,
    rows: int,
    include_cover: bool = False,
) -> float:
    widths = [24, 92, 92, 70, 55, 75]
    labels = ["No.", "Surname", "First name/s", "Date of birth", "Gender", "Relationship"]
    if include_cover:
        widths += [64, 70]
        labels += ["Cover (BWP)", "Premium (BWP)"]
    total = sum(widths)
    scale = (PAGE_WIDTH - 2 * MARGIN) / total
    widths = [width * scale for width in widths]
    row_height = 24
    x = MARGIN
    pdf.setFillColor(LIGHT_BLUE)
    pdf.rect(x, y - row_height, sum(widths), row_height, fill=1, stroke=0)
    pdf.setStrokeColor(LINE)
    pdf.rect(x, y - row_height * (rows + 1), sum(widths), row_height * (rows + 1), fill=0, stroke=1)
    for index, width in enumerate(widths):
        pdf.setFillColor(DEEP_BLUE)
        pdf.setFont("Helvetica-Bold", 6.5)
        pdf.drawCentredString(x + width / 2, y - 15, labels[index])
        if index:
            pdf.line(x, y, x, y - row_height * (rows + 1))
        x += width
    for row in range(rows):
        row_top = y - row_height * (row + 1)
        pdf.line(MARGIN, row_top - row_height, PAGE_WIDTH - MARGIN, row_top - row_height)
        x = MARGIN
        pdf.setFillColor(MUTED)
        pdf.setFont("Helvetica", 7)
        pdf.drawCentredString(x + widths[0] / 2, row_top - 16, str(row + 1))
        x += widths[0]
        for column, width in enumerate(widths[1:], start=1):
            field_name = f"{prefix}_{row + 1}_{column}"
            pdf.acroForm.textfield(
                name=field_name,
                tooltip=f"{labels[column]} row {row + 1}",
                x=x + 2,
                y=row_top - row_height + 3,
                width=width - 4,
                height=row_height - 6,
                borderWidth=0,
                fillColor=colors.white,
                textColor=TEXT,
                fontName="Helvetica",
                fontSize=7.5,
            )
            x += width
    return y - row_height * (rows + 1) - 14


def create_deduction_form() -> None:
    pdf = new_canvas("deduction-form.pdf", "BONU Salary Deduction Authorisation")
    y = header(pdf, "AUTHORISATION OF DEDUCTION FROM SALARY")
    y = section(pdf, y, "Member details")
    col = (PAGE_WIDTH - 2 * MARGIN - 16) / 2
    text_field(pdf, "member_full_name", "Full name", MARGIN, y - 22, col, required=True)
    text_field(pdf, "identity_number", "Omang / passport number", MARGIN + col + 16, y - 22, col, required=True)
    text_field(pdf, "payroll_number", "Payroll number", MARGIN, y - 64, col, required=True)
    text_field(pdf, "professional_registration_number", "Professional registration number", MARGIN + col + 16, y - 64, col)
    text_field(pdf, "employer", "Employer / ministry / council", MARGIN, y - 106, col, required=True)
    text_field(pdf, "work_station", "Work station", MARGIN + col + 16, y - 106, col)
    text_field(pdf, "monthly_deduction", "Approved monthly deduction (BWP)", MARGIN, y - 148, col, required=True)
    text_field(pdf, "effective_month", "Effective month (MM/YYYY)", MARGIN + col + 16, y - 148, col, required=True)
    y -= 190
    y = section(pdf, y, "Contact details")
    text_field(pdf, "physical_address", "Physical address", MARGIN, y - 22, col)
    text_field(pdf, "postal_address", "Postal address", MARGIN + col + 16, y - 22, col)
    text_field(pdf, "mobile_number", "Mobile number", MARGIN, y - 64, col, required=True)
    text_field(pdf, "email_address", "Email address", MARGIN + col + 16, y - 64, col, required=True)
    y -= 108
    y = section(pdf, y, "Authorisation")
    declaration = (
        "I authorise my employer to deduct the amount stated above from my salary and remit it to the "
        "Botswana Nurses Union for my approved membership and benefit obligations. This authorisation remains "
        "in force until cancelled in writing in accordance with BONU and employer requirements."
    )
    y = wrapped_text(pdf, declaration, MARGIN, y - 4, PAGE_WIDTH - 2 * MARGIN)
    checkbox(pdf, "declaration_accepted", "I confirm that I have read and accept this authorisation.", MARGIN, y - 16)
    text_field(pdf, "member_signature", "Member signature (type full name or sign after printing)", MARGIN, y - 64, col, required=True)
    text_field(pdf, "signature_date", "Date (DD/MM/YYYY)", MARGIN + col + 16, y - 64, col, required=True)
    text_field(pdf, "employer_official_name", "Employer official name", MARGIN, y - 106, col)
    text_field(pdf, "employer_official_signature", "Employer stamp / signature", MARGIN + col + 16, y - 106, col)
    footer(pdf, 1, "BONU salary deduction authorisation")
    pdf.save()


def create_direct_debit_form() -> None:
    pdf = new_canvas("direct-debit-form.pdf", "BONU Direct Debit Authorisation")
    y = header(pdf, "AUTHORISATION FOR DIRECT ACCOUNT DEBIT")
    y = section(pdf, y, "Member and debit instruction")
    col = (PAGE_WIDTH - 2 * MARGIN - 16) / 2
    text_field(pdf, "member_full_name", "Full name", MARGIN, y - 22, col, required=True)
    text_field(pdf, "identity_number", "Omang / passport number", MARGIN + col + 16, y - 22, col, required=True)
    text_field(pdf, "professional_registration_number", "Professional registration number", MARGIN, y - 64, col)
    text_field(pdf, "monthly_debit_amount", "Approved monthly debit (BWP)", MARGIN + col + 16, y - 64, col, required=True)
    text_field(pdf, "effective_month", "Effective month (MM/YYYY)", MARGIN, y - 106, col, required=True)
    text_field(pdf, "preferred_debit_day", "Preferred debit day", MARGIN + col + 16, y - 106, col, required=True)
    y -= 148
    y = section(pdf, y, "Bank account details")
    text_field(pdf, "account_holder_name", "Account holder name", MARGIN, y - 22, PAGE_WIDTH - 2 * MARGIN, required=True)
    text_field(pdf, "account_number", "Account number", MARGIN, y - 64, col, required=True)
    text_field(pdf, "bank_name", "Bank", MARGIN + col + 16, y - 64, col, required=True)
    text_field(pdf, "branch_name", "Branch name", MARGIN, y - 106, col, required=True)
    text_field(pdf, "branch_code", "Branch code", MARGIN + col + 16, y - 106, col, required=True)
    checkbox(pdf, "account_current", "Current", MARGIN, y - 144)
    checkbox(pdf, "account_savings", "Savings", MARGIN + 92, y - 144)
    checkbox(pdf, "account_transmission", "Transmission", MARGIN + 184, y - 144)
    y -= 172
    y = section(pdf, y, "BONU beneficiary details")
    text_field(pdf, "beneficiary_bank", "BONU bank", MARGIN, y - 22, col)
    text_field(pdf, "beneficiary_account", "BONU account number", MARGIN + col + 16, y - 22, col)
    text_field(pdf, "beneficiary_branch", "BONU branch", MARGIN, y - 64, col)
    text_field(pdf, "beneficiary_branch_code", "BONU branch code", MARGIN + col + 16, y - 64, col)
    y -= 106
    y = section(pdf, y, "Authorisation")
    y = wrapped_text(
        pdf,
        "I authorise my bank to debit the account above for the approved BONU amount. This instruction remains "
        "active until cancelled in writing, subject to the notice period required by BONU and my bank.",
        MARGIN,
        y - 4,
        PAGE_WIDTH - 2 * MARGIN,
    )
    checkbox(pdf, "declaration_accepted", "I confirm that the account details and authorisation are correct.", MARGIN, y - 16)
    text_field(pdf, "account_holder_signature", "Account holder signature (type full name or sign after printing)", MARGIN, y - 64, col, required=True)
    text_field(pdf, "signature_date", "Date (DD/MM/YYYY)", MARGIN + col + 16, y - 64, col, required=True)
    footer(pdf, 1, "BONU direct debit authorisation")
    pdf.save()


def create_funeral_policy_form() -> None:
    pdf = new_canvas("funeral-policy-form.pdf", "BONU Group Funeral Cover Proposal")
    y = header(pdf, "BONU GROUP FUNERAL COVER PROPOSAL", "Complete all applicable sections. Fields marked * are required.")
    checkbox(pdf, "application_new", "New application", MARGIN, y)
    checkbox(pdf, "application_amendment", "Amendment", MARGIN + 130, y)
    checkbox(pdf, "application_termination", "Termination", MARGIN + 245, y)
    text_field(pdf, "effective_date", "Effective date", MARGIN + 365, y - 4, 104, required=True)
    y -= 48
    y = section(pdf, y, "Primary insured person", "Maximum entry age and cover terms are subject to the approved BONU policy schedule.")
    col = (PAGE_WIDTH - 2 * MARGIN - 16) / 2
    text_field(pdf, "member_number", "BONU member / employee number", MARGIN, y - 22, col, required=True)
    text_field(pdf, "primary_surname", "Surname", MARGIN + col + 16, y - 22, col, required=True)
    text_field(pdf, "primary_first_names", "First name/s", MARGIN, y - 64, col, required=True)
    text_field(pdf, "primary_id", "Omang / passport number", MARGIN + col + 16, y - 64, col, required=True)
    text_field(pdf, "primary_dob", "Date of birth (DD/MM/YYYY)", MARGIN, y - 106, col, required=True)
    text_field(pdf, "primary_gender", "Gender", MARGIN + col + 16, y - 106, col)
    text_field(pdf, "primary_mobile", "Mobile number", MARGIN, y - 148, col, required=True)
    text_field(pdf, "primary_email", "Email address", MARGIN + col + 16, y - 148, col)
    text_field(pdf, "primary_address", "Postal / physical address", MARGIN, y - 190, PAGE_WIDTH - 2 * MARGIN, height=34, multiline=True)
    y -= 246
    y = section(pdf, y, "Spouse")
    text_field(pdf, "spouse_surname", "Surname", MARGIN, y - 22, col)
    text_field(pdf, "spouse_first_names", "First name/s", MARGIN + col + 16, y - 22, col)
    text_field(pdf, "spouse_id", "Omang / passport number", MARGIN, y - 64, col)
    text_field(pdf, "spouse_dob", "Date of birth (DD/MM/YYYY)", MARGIN + col + 16, y - 64, col)
    text_field(pdf, "spouse_mobile", "Mobile number", MARGIN, y - 106, col)
    text_field(pdf, "spouse_gender", "Gender", MARGIN + col + 16, y - 106, col)
    footer(pdf, 1, "BONU group funeral cover proposal")
    pdf.showPage()

    y = header(pdf, "FUNERAL COVER: CHILDREN", "Add only eligible children and attach supporting proof where required.")
    y = section(pdf, y, "Children", "Eligibility is subject to the approved insurer policy terms and age limits.")
    y = person_table(pdf, y, "child", 8)
    y = section(pdf, y, "Beneficiary", "The beneficiary must be 18 years or older.")
    text_field(pdf, "beneficiary_surname", "Surname", MARGIN, y - 22, col, required=True)
    text_field(pdf, "beneficiary_first_names", "First name/s", MARGIN + col + 16, y - 22, col, required=True)
    text_field(pdf, "beneficiary_id", "Omang / passport number", MARGIN, y - 64, col, required=True)
    text_field(pdf, "beneficiary_relationship", "Relationship", MARGIN + col + 16, y - 64, col, required=True)
    text_field(pdf, "beneficiary_contact", "Contact number", MARGIN, y - 106, col, required=True)
    text_field(pdf, "beneficiary_email", "Email address", MARGIN + col + 16, y - 106, col)
    y -= 154
    y = section(pdf, y, "Declaration")
    y = wrapped_text(
        pdf,
        "I declare that the information supplied in this proposal is true and complete. I understand that entry "
        "ages, benefits, premiums, waiting periods, eligibility and acceptance are governed by the current BONU "
        "group funeral policy and the insurer's approved terms.",
        MARGIN,
        y - 4,
        PAGE_WIDTH - 2 * MARGIN,
    )
    checkbox(pdf, "funeral_declaration_accepted", "I accept the declaration above.", MARGIN, y - 16)
    text_field(pdf, "primary_signature", "Primary insured signature (type full name or sign after printing)", MARGIN, y - 64, col, required=True)
    text_field(pdf, "proposal_date", "Date (DD/MM/YYYY)", MARGIN + col + 16, y - 64, col, required=True)
    footer(pdf, 2, "BONU group funeral cover proposal")
    pdf.save()


def create_additional_member_form() -> None:
    pdf = new_canvas("additional-member-funeral-form.pdf", "BONU Additional Funeral Members")
    y = header(pdf, "ADDITIONAL FUNERAL COVER MEMBERS", "Use this optional form to add parents, parents-in-law or extended family.")
    y = section(pdf, y, "Primary member and payment")
    col = (PAGE_WIDTH - 2 * MARGIN - 16) / 2
    text_field(pdf, "member_full_name", "Primary member full name", MARGIN, y - 22, col, required=True)
    text_field(pdf, "identity_number", "Omang / passport number", MARGIN + col + 16, y - 22, col, required=True)
    text_field(pdf, "member_number", "BONU member / employee number", MARGIN, y - 64, col, required=True)
    text_field(pdf, "professional_registration_number", "Professional registration number", MARGIN + col + 16, y - 64, col)
    text_field(pdf, "additional_monthly_premium", "Total additional monthly premium (BWP)", MARGIN, y - 106, col, required=True)
    text_field(pdf, "effective_month", "Effective month (MM/YYYY)", MARGIN + col + 16, y - 106, col, required=True)
    y -= 150
    y = section(pdf, y, "Parents and parents-in-law", "Add only persons who meet the current policy entry requirements.")
    y = person_table(pdf, y, "parent", 5, include_cover=True)
    y = section(pdf, y, "Extended family", "Add only persons who meet the current policy entry requirements.")
    y = person_table(pdf, y, "extended", 5, include_cover=True)
    footer(pdf, 1, "BONU additional funeral cover members")
    pdf.showPage()

    y = header(pdf, "ADDITIONAL MEMBERS: PAYMENT AUTHORISATION")
    y = section(pdf, y, "Contact details")
    text_field(pdf, "physical_address", "Physical address", MARGIN, y - 22, col)
    text_field(pdf, "postal_address", "Postal address", MARGIN + col + 16, y - 22, col)
    text_field(pdf, "mobile_number", "Mobile number", MARGIN, y - 64, col, required=True)
    text_field(pdf, "email_address", "Email address", MARGIN + col + 16, y - 64, col, required=True)
    y -= 108
    y = section(pdf, y, "Payment method")
    checkbox(pdf, "payment_payroll", "Payroll deduction", MARGIN, y - 10)
    checkbox(pdf, "payment_direct_debit", "Direct debit", MARGIN + 150, y - 10)
    checkbox(pdf, "payment_other", "Other approved method", MARGIN + 280, y - 10)
    text_field(pdf, "account_holder_name", "Account holder name (direct debit only)", MARGIN, y - 54, PAGE_WIDTH - 2 * MARGIN)
    text_field(pdf, "account_number", "Account number", MARGIN, y - 96, col)
    text_field(pdf, "bank_name", "Bank", MARGIN + col + 16, y - 96, col)
    text_field(pdf, "branch_name", "Branch name", MARGIN, y - 138, col)
    text_field(pdf, "branch_code", "Branch code", MARGIN + col + 16, y - 138, col)
    y -= 182
    y = section(pdf, y, "Authorisation and declaration")
    y = wrapped_text(
        pdf,
        "I request cover for the additional persons listed and authorise collection of the approved additional "
        "premium using the selected payment method. I declare that the information provided is true and understand "
        "that all applications are subject to BONU and insurer verification and acceptance.",
        MARGIN,
        y - 4,
        PAGE_WIDTH - 2 * MARGIN,
    )
    checkbox(pdf, "additional_declaration_accepted", "I accept the authorisation and declaration above.", MARGIN, y - 16)
    text_field(pdf, "member_signature", "Member signature (type full name or sign after printing)", MARGIN, y - 64, col, required=True)
    text_field(pdf, "signature_date", "Date (DD/MM/YYYY)", MARGIN + col + 16, y - 64, col, required=True)
    footer(pdf, 2, "BONU additional funeral cover members")
    pdf.save()


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    prepare_logo()
    create_deduction_form()
    create_direct_debit_form()
    create_funeral_policy_form()
    create_additional_member_form()
    print(f"Generated fillable forms in {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
