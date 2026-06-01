import sys
import json
import os
from collections import defaultdict
import math
from datetime import datetime

# Consistent mapping for training accuracy
TRAINING_DATA_MAP = {
    "Acme Corp Salary": "Salary",
    "City Apartments Rent": "Housing",
    "Trader Joe's": "Groceries",
    "Uber Ride": "Transport",
    "Comcast Internet": "Utilities",
    "Shell Gas Station": "Utilities",
    "Gym Membership": "Health",
    "Amazon Purchase": "Shopping",
    "Starbucks": "Dining"
}

def parse_date(date_str):
    if not date_str:
        return None
    try:
        if 'T' in date_str:
            return datetime.strptime(date_str.split('T')[0], "%Y-%m-%d")
        return datetime.strptime(date_str, "%Y-%m-%d")
    except ValueError:
        return None

def detect_recurring(expenses):
    """Detects recurring transactions (Essentials) like Rent, Subscriptions, etc."""
    recurring = []
    
    # Group by description
    grouped = defaultdict(list)
    for t in expenses:
        grouped[t['description']].append(t)
        
    for desc, group in grouped.items():
        if len(group) >= 2:
            group = sorted(group, key=lambda x: x['date'])
            
            # Check intervals
            intervals = [(group[i]['date'] - group[i-1]['date']).days for i in range(1, len(group))]
            is_monthly = any((25 <= days <= 35) for days in intervals)
            
            # Check amount stability (coefficient of variation < 0.1)
            amounts = [t['amount'] for t in group]
            mean_amt = sum(amounts) / len(amounts)
            if mean_amt > 0:
                variance = sum((x - mean_amt) ** 2 for x in amounts) / len(amounts)
                std_dev = math.sqrt(variance)
                cv = std_dev / mean_amt
            else:
                cv = 0
                
            if is_monthly or cv < 0.1:
                recurring.append({
                    "name": desc,
                    "amount": float(group[-1]['amount']),
                    "category": group[-1].get('category', 'Other')
                })
                
    return recurring

def generate_heuristic_insights(data, math_data, forecast_data, recurring):
    """Generates textual insights tailored for different application pages."""
    income = math_data['totalIncome']
    expense = math_data['totalExpense']
    savings_ratio = math_data['savingsRatio']
    
    top_category = "N/A"
    if math_data['categoryBreakdown']:
        top_category = max(math_data['categoryBreakdown'], key=math_data['categoryBreakdown'].get)
    
    insights = {
        "dashboard": "",
        "transactions": "",
        "forecast": "",
        "goals": ""
    }
    
    # 1. Dashboard Insight
    dash_bits = []
    if income > 0 and expense > income * 0.8:
        dash_bits.append(f"Your spending is quite high ({expense/income:.0%} of income). Consider reviewing your {top_category} costs.")
    elif savings_ratio > 0.2:
        dash_bits.append(f"Excellent savings rate of {savings_ratio:.0%}. You're in a great position to invest your surplus.")
    else:
        dash_bits.append(f"Your budget is balanced, but there's room to optimize your {top_category} spending for more savings.")
    
    top_cat_amt = math_data['categoryBreakdown'].get(top_category, 0)
    dash_bits.append(f"Tip: Try to cap your {top_category} spending at {top_cat_amt * 0.9:.2f} next month.")
    insights["dashboard"] = " ".join(dash_bits)
    
    # 2. Transactions Insight (Habit Analysis)
    trans_bits = []
    expenses = [t for t in data if t['type'] == 'expense']
    
    weekend_spend = sum(t['amount'] for t in expenses if t['date'].weekday() >= 5)
    weekday_spend = sum(t['amount'] for t in expenses if t['date'].weekday() < 5)
    
    if weekend_spend > weekday_spend * 0.5:
        trans_bits.append("Weekend Surge: You spend significantly more on Saturdays and Sundays.")
    else:
        trans_bits.append("Steady Spending: Your expenses are distributed consistently throughout the week.")
        
    if top_category != "N/A":
        trans_bits.append(f"Analysis shows {top_category} is your most frequent spending area.")
    insights["transactions"] = " ".join(trans_bits)
    
    # 3. Forecast Insight
    fore_bits = []
    predicted_expense = forecast_data['predictedExpense']
    if predicted_expense > expense:
        fore_bits.append(f"Upward Trend: Next month's expenses are projected to rise to {predicted_expense:.2f} based on current habits.")
    else:
        fore_bits.append("Maintaining Stability: Next month's expenses are projected to remain steady or decrease slightly.")
    insights["forecast"] = " ".join(fore_bits)
    
    # 4. Goals Insight
    goal_bits = []
    surplus = income - expense
    if surplus > 0:
        goal_bits.append(f"Goal Ready: You have a monthly surplus of {surplus:.2f}.")
        if recurring:
            goal_bits.append(f"We've locked in {len(recurring)} recurring essentials as mandatory baselines.")
    else:
        goal_bits.append("Budget Warning: Your current spending exceeds income. Reduce non-essentials before setting new goals.")
    insights["goals"] = " ".join(goal_bits)
    
    # Fallback/Merged for legacy compatibility
    insights["overview"] = insights["dashboard"]
    
    return insights

def simple_linear_regression(x, y):
    n = len(x)
    if n == 0:
        return 0, 0
    if n == 1:
        return y[0], 0
    sum_x = sum(x)
    sum_y = sum(y)
    sum_x2 = sum(xi**2 for xi in x)
    sum_xy = sum(xi*yi for xi, yi in zip(x, y))
    
    denominator = (n * sum_x2 - sum_x**2)
    if denominator == 0:
        return sum_y / n, 0
        
    m = (n * sum_xy - sum_x * sum_y) / denominator
    b = (sum_y - m * sum_x) / n
    return b, m

def predict_by_category_summation(expenses, current_income):
    if not expenses:
        return {"predictedExpense": 0, "predictedSavings": float(current_income), "categories": []}
        
    min_date = min(t['date'] for t in expenses)
    
    def get_month_index(d):
        return (d.year - min_date.year) * 12 + (d.month - min_date.month)
        
    for t in expenses:
        t['month_index'] = get_month_index(t['date'])
        
    next_month_idx = max(t['month_index'] for t in expenses) + 1
    
    grouped_by_cat_month = defaultdict(lambda: defaultdict(float))
    for t in expenses:
        grouped_by_cat_month[t['category']][t['month_index']] += t['amount']
        
    predicted_categories = []
    total_sum_of_predictions = 0
    
    for cat, month_data in grouped_by_cat_month.items():
        if not month_data:
            continue
            
        months = sorted(month_data.keys())
        amounts = [month_data[m] for m in months]
        last_known_val = amounts[-1]
        
        if len(months) >= 2:
            b, m = simple_linear_regression(months, amounts)
            prediction = b + m * next_month_idx
            prediction = max(0.0, float(prediction))
        else:
            prediction = last_known_val
            
        predicted_categories.append({
            "name": str(cat),
            "amount": float(round(prediction, 2))
        })
        total_sum_of_predictions += prediction
        
    return {
        "predictedExpense": float(round(total_sum_of_predictions, 2)),
        "predictedSavings": float(round(current_income - total_sum_of_predictions, 2)),
        "categories": predicted_categories
    }

def analyze_data(file_path):
    try:
        if not os.path.exists(file_path):
            return {"error": f"File not found: {file_path}"}
            
        with open(file_path, 'r') as f:
            raw_data = json.load(f)
            
        if not raw_data:
            return {"error": "No data in file"}
            
        data = []
        for row in raw_data:
            d = parse_date(row.get('date'))
            amt = None
            try:
                amt = float(row.get('amount'))
            except (ValueError, TypeError):
                pass
            
            if d is not None and amt is not None:
                new_row = dict(row)
                new_row['date'] = d
                new_row['amount'] = amt
                
                # Heuristic categorization
                if 'category' not in new_row or new_row['category'] == 'Other':
                    desc = new_row.get('description', '')
                    if desc in TRAINING_DATA_MAP:
                        new_row['category'] = TRAINING_DATA_MAP[desc]
                    else:
                        lower_desc = desc.lower()
                        if 'market' in lower_desc or 'grocery' in lower_desc:
                            new_row['category'] = 'Groceries'
                        elif 'electric' in lower_desc or 'internet' in lower_desc:
                            new_row['category'] = 'Utilities'
                        elif 'netflix' in lower_desc or 'hbo' in lower_desc:
                            new_row['category'] = 'Entertainment'
                        elif 'uber' in lower_desc or 'lyft' in lower_desc or 'gas' in lower_desc:
                            new_row['category'] = 'Transport'
                        else:
                            new_row['category'] = 'Other'
                
                data.append(new_row)
                
        if not data:
            return {"error": "Empty dataframe"}
            
        income_transactions = [t for t in data if t.get('type') == 'income']
        expense_transactions = [t for t in data if t.get('type') == 'expense']
        
        total_income = sum(t['amount'] for t in income_transactions)
        total_expense = sum(t['amount'] for t in expense_transactions)
        
        category_breakdown = defaultdict(float)
        for t in expense_transactions:
            category_breakdown[t['category']] += t['amount']
            
        forecast_results = predict_by_category_summation(expense_transactions, total_income)
        essentials = detect_recurring(expense_transactions)
        
        math_data = {
            "totalIncome": float(total_income),
            "totalExpense": float(total_expense),
            "categoryBreakdown": {k: float(v) for k, v in category_breakdown.items()},
            "savingsRatio": float((total_income - total_expense) / total_income if total_income > 0 else 0)
        }
        
        insights = generate_heuristic_insights(data, math_data, forecast_results, essentials)
        
        # Serialize dates back to string for output
        out_data = []
        for t in data:
            out_row = dict(t)
            out_row['date'] = t['date'].strftime('%Y-%m-%d')
            # Remove temporary keys
            if 'month_index' in out_row:
                del out_row['month_index']
            out_data.append(out_row)
            
        return {
            "math": math_data,
            "forecast": forecast_results,
            "essentials": essentials,
            "insights": insights,
            "overview": insights["overview"],
            "transactions": out_data
        }
    except Exception as e:
        import traceback
        print(traceback.format_exc(), file=sys.stderr)
        return {"error": str(e)}

if __name__ == "__main__":
    if len(sys.argv) > 1:
        result = analyze_data(sys.argv[1])
        print(json.dumps(result))
    else:
        print(json.dumps({"error": "No input file path provided"}))
