# Data Model Draft

This is a conceptual data model for implementation.

## Core

User: id, name, email_or_username, role student|coach|admin, cohort_id, created_at, last_login_at.

Cohort: id, name, start_date, end_date, program_type, settings.

StudentProfile: id, user_id, grade_level, school, worksite, interests, goals, profile_status.

Mission: id, title, description, module, estimated_minutes, due_date, order, required_output_type, active.

StudentMissionProgress: id, student_id, mission_id, status, started_at, submitted_at, reviewed_at, coach_feedback.

WorksheetResponse: id, student_id, worksheet_type, mission_id, raw_inputs_json, ai_questions_json, ai_outputs_json, selected_output_json, version, timestamps.

PortfolioArtifact: id, student_id, artifact_type, title, content, source_worksheet_id, coach_status draft|needs_review|approved, exported_at, timestamps.

AISession: id, student_id, module, input_text, ai_response_json, prompt_version, created_at.

## Game

GameSession: id, cohort_id, game_type marketplace_housing|market_day, title, status setup|active|complete, round, settings_json, created_by, created_at.

PlayerGameState: id, game_session_id, student_id, role, profile_json, cash, credit_score, income, savings, debt, assets_json, liabilities_json, current_status_json.

Property: id, game_session_id, owner_student_id nullable, npc_owner_name nullable, property_type, price, rent, deposit, min_credit_score, estimated_payment, taxes, insurance, maintenance, risk_rating, status.

HousingApplication: id, property_id, student_id, application_type rent|buy, offered_price, status pending|approved|rejected, rejection_reason, created_at.

StudentBusiness: id, game_session_id, student_id, business_name, category, product_or_service, target_customer, value_proposition, input_level, quality_score, unit_cost, price, inventory_or_capacity, marketing_spend, status.

Purchase: id, game_session_id, buyer_student_id, seller_business_id nullable, npc_store_id nullable, quantity, unit_price, total_price, satisfaction_rating, round, created_at.

MarketEvent: id, game_session_id, event_type, title, description, effects_json, round_applied.

PAndL: id, business_id, revenue, cogs, gross_profit, operating_expenses, net_profit, profit_margin, units_sold, inventory_left, customer_satisfaction, created_at.
