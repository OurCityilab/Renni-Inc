# Calculator Rules

These calculators are educational approximations, not financial advice. Always display assumptions.

## Take-home pay approximation

monthly_gross = annual_salary / 12
estimated_take_home = monthly_gross * 0.75

Allow admin to adjust take-home factor.

## Debt-to-income ratio

DTI = monthly_debt_payments / monthly_gross_income

## Rent affordability

max_safe_rent = estimated_take_home * 0.30
max_stretch_rent = estimated_take_home * 0.40

Landlord qualification rule: monthly_gross_income >= rent * landlord_income_multiplier, default multiplier 3; credit_score >= landlord_min_credit; savings >= deposit.

## Car affordability

Inputs: car price, down payment, loan term months, APR, insurance estimate, maintenance estimate.

Monthly loan payment formula:
P = principal * monthly_rate / (1 - (1 + monthly_rate)^(-term_months))

Total monthly car cost = loan payment + insurance + maintenance.

## Mortgage approximation

Inputs: purchase price, down payment, APR, term months, taxes, insurance, maintenance reserve, existing debt.

Total monthly housing cost = principal/interest + taxes + insurance + maintenance reserve.

Qualification: front-end ratio <= 0.33, back-end ratio <= 0.43, credit score >= selected loan minimum, savings >= down payment + closing estimate.

## P&L

Revenue = units_sold * price_per_unit
COGS = units_sold * cost_per_unit
Gross Profit = Revenue - COGS
Operating Expenses = marketing + booth_fee + tools + other_expenses
Net Profit = Gross Profit - Operating Expenses
Profit Margin = Net Profit / Revenue

Handle zero revenue by displaying N/A for margin.

## Break-even quantity

Break-even units = fixed_costs / (price_per_unit - variable_cost_per_unit)

If contribution margin <= 0, display: You cannot break even at this price because each sale loses money.

## Market Day customer satisfaction

MVP: student rating 1–5. NPC purchases can have default ratings based on quality and price.

## Conversion rate

conversion_rate = purchases_from_business / number_of_student_buyers_exposed. If exposure count unavailable, use total active buyers in the round.
