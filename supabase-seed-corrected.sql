-- Corrected SQL INSERT statements for NFL betting data
-- Matches the actual schema defined in migrations/0001_init.sql
-- To be run in Supabase SQL Editor

-- ============================================
-- REPORTS TABLE - Weekly summaries
-- ============================================

INSERT INTO reports (slug, label, report_date, total_wagered, total_return, net_profit, roi_percent, hit_rate, summary, source_pdf) VALUES
('week-1-friday-2025', 'Week 1 Friday - Chiefs vs Chargers', '2025-09-05', 330.00, 726.00, 396.00, 120.0, 50.0, 'Excellent opening night with 120% ROI. Herbert parlay hit big for $529 profit. Split 2-2 on spreads and totals.', 'nfl-week1-friday.pdf'),
('week-1-monday-2025', 'Week 1 Monday - Vikings vs Bears', '2025-09-09', 1700.00, 3639.00, 1939.00, 114.1, 80.0, 'Outstanding Monday night performance with 80% hit rate on player props. Strong start to the season.', 'nfl-week1-monday.pdf'),
('week-2-sunday-2025', 'Week 2 Sunday Afternoon', '2025-09-14', 882.00, 989.06, 107.06, 12.14, 50.0, 'Solid week with 3-1 on spreads. Broncos loss cost us both parlays but individual bets performed well.', 'nfl-week2.pdf'),
('week-3-sunday-2025', 'Week 3 Sunday', '2025-09-21', 961.00, 1174.00, 213.00, 22.2, 60.0, 'Seahawks crushed the Saints covering -7.5 easily. 3 of 5 bets hit for healthy profit.', 'nfl-week3.pdf'),
('week-4-sunday-2025', 'Week 4 Sunday', '2025-09-28', 1500.01, 2063.89, 563.88, 37.6, 76.2, 'Exceptional week across spreads and props. 16 of 21 bets won. Player props dominated with 76% ROI.', 'nfl-week4.pdf'),
('week-5-mnf-2025', 'Week 5 Monday Night - Jaguars Upset', '2025-10-06', 2250.00, 3217.55, 967.55, 42.99, 40.0, 'Massive win on Jaguars ML +160 for $1,600 profit. Upset special paid off despite prop struggles.', 'nfl-week5-mnf.pdf'),
('week-5-sunday-2025', 'Week 5 Sunday Afternoon', '2025-10-05', 2250.00, 1993.48, -256.52, -11.4, 38.9, 'Tough week with Cardinals and Seahawks upsets. Moneyline bets on heavy favorites backfired.', 'nfl-week5-sunday.pdf'),
('week-6-afternoon-2025', 'Week 6 Sunday Afternoon', '2025-10-13', 570.00, 218.10, -351.90, -61.74, 25.0, 'Difficult afternoon with favorites underperforming. Only 3 of 12 bets won as underdogs covered.', 'nfl-week6-afternoon.pdf'),
('week-6-mnf-2025', 'Week 6 Monday Night', '2025-10-13', 1178.55, 1494.35, 315.80, 26.8, 71.4, 'Bounce-back night with excellent player prop performance. Parlays saved the week with +191% ROI.', 'nfl-week6-mnf.pdf'),
('week-7-sunday-2025', 'Week 7 Sunday - Lions vs Texans', '2025-10-19', 1334.13, 748.75, -585.38, -43.9, 27.3, 'Rough Sunday with heavy losses on player props. Only bright spot was Jaxon Smith-Njigba over.', 'nfl-week7-sunday.pdf'),
('week-8-sunday-2025', 'Week 8 Sunday', '2025-10-26', 2400.00, 3396.20, 996.20, 41.5, 61.5, 'Strong recovery week. Spreads and parlays crushed it with 45% and 75% ROI respectively.', 'nfl-week8-sunday.pdf');

-- ============================================
-- BETS TABLE - Individual wagers (PENDING BETS)
-- These are current open positions
-- ============================================

INSERT INTO bets (title, description, stake, odds, decimal_odds, event_date, status, category) VALUES
-- Week 9 pending bets (current in-market plays)
('Ravens -3.5 @ Bengals', 'Thursday Night Football spread play - Ravens strong defensive performance expected', 150.00, '-110', 1.909, '2025-10-30', 'pending', 'Spread'),
('Lamar Jackson OVER 242.5 passing yards', 'Bengals allowing 270+ pass yards per game - Jackson should exceed easily', 100.00, '-115', 1.870, '2025-10-30', 'pending', 'Player Prop'),
('Ravens vs Bengals OVER 51.5', 'Both teams averaging 28+ PPG - expect shootout', 75.00, '-110', 1.909, '2025-10-30', 'pending', 'Total'),
('Mark Andrews Anytime TD', 'Red zone target monster - 6 TDs in last 4 games', 50.00, '+140', 2.400, '2025-10-30', 'pending', 'Player Prop'),
('Cowboys +7 vs Falcons', 'Sunday afternoon value play - Cowboys getting healthier on defense', 200.00, '-110', 1.909, '2025-11-02', 'pending', 'Spread'),
('CeeDee Lamb OVER 88.5 receiving yards', 'Falcons secondary banged up - Lamb should feast', 125.00, '-110', 1.909, '2025-11-02', 'pending', 'Player Prop'),
('Bills ML + Eagles ML Parlay', 'Two-team moneyline parlay - both teams at home against weak opponents', 100.00, '+165', 2.650, '2025-11-02', 'pending', 'Parlay'),
('Josh Allen OVER 1.5 passing TDs', 'Allen averaging 2.8 TD passes per home game', 80.00, '-135', 1.741, '2025-11-02', 'pending', 'Player Prop'),
('49ers -3 @ Buccaneers', 'Sunday Night Football - 49ers getting CMC back, Buccaneers injuries piling up', 175.00, '-110', 1.909, '2025-11-03', 'pending', 'Spread'),
('Christian McCaffrey OVER 115.5 rush+rec yards', 'CMC return game - expect heavy usage to re-establish rhythm', 150.00, '-120', 1.833, '2025-11-03', 'pending', 'Player Prop');

-- ============================================
-- BETS TABLE - Completed/Graded bets
-- These have results attached
-- ============================================

-- Week 1 Friday (Sep 5, 2025)
INSERT INTO bets (title, description, stake, odds, decimal_odds, event_date, status, result_notes, category, report_id) VALUES
('Travis Kelce OVER 58.5 rec yards', 'Week 1 Friday opening game receiving prop', 128.00, '-110', 1.909, '2025-09-05', 'lost', 'Kelce only managed 42 yards - Chiefs ran heavy', 'Player Prop', (SELECT id FROM reports WHERE slug = 'week-1-friday-2025')),
('Justin Herbert 3-leg parlay', 'Herbert O275.5 yards + O1.5 TDs + Chargers +3.5', 128.00, '+412', 5.120, '2025-09-05', 'won', 'Huge parlay hit! Herbert threw 312 yards and 2 TDs, Chargers covered', 'Parlay', (SELECT id FROM reports WHERE slug = 'week-1-friday-2025')),
('Chargers +3.5', 'Spread play on opening night', 50.00, '-110', 1.909, '2025-09-05', 'won', 'Chargers covered in close 24-22 loss', 'Spread', (SELECT id FROM reports WHERE slug = 'week-1-friday-2025')),
('Chiefs vs Chargers UNDER 47.5', 'Total points under', 55.00, '-110', 1.909, '2025-09-05', 'lost', 'Game went over with 46 combined points (close call)', 'Total', (SELECT id FROM reports WHERE slug = 'week-1-friday-2025'));

-- Week 1 Monday (Sep 9, 2025)
INSERT INTO bets (title, description, stake, odds, decimal_odds, event_date, status, result_notes, category, report_id) VALUES
('Aaron Jones OVER 20 receiving yards', 'Monday Night Football prop', 340.00, '-114', 1.877, '2025-09-09', 'won', 'Jones had 38 receiving yards - easy cash', 'Player Prop', (SELECT id FROM reports WHERE slug = 'week-1-monday-2025')),
('Caleb Williams UNDER 218.5 passing yards', 'Bears QB under play', 340.00, '-110', 1.909, '2025-09-09', 'won', 'Williams threw only 185 yards - Bears ran heavy', 'Player Prop', (SELECT id FROM reports WHERE slug = 'week-1-monday-2025')),
('J.J. McCarthy UNDER 223.5 passing yards', 'Vikings rookie QB under', 340.00, '-105', 1.952, '2025-09-09', 'won', 'McCarthy 201 yards - conservative game script', 'Player Prop', (SELECT id FROM reports WHERE slug = 'week-1-monday-2025')),
('Colston Loveland Anytime TD', 'Bears TE touchdown scorer', 340.00, '+180', 2.800, '2025-09-09', 'lost', 'Loveland targeted only 3 times, no TDs', 'Player Prop', (SELECT id FROM reports WHERE slug = 'week-1-monday-2025')),
('3-team player props parlay', 'Jones rec over + Williams pass under + McCarthy pass under', 340.00, '+286', 3.860, '2025-09-09', 'won', 'Massive parlay win! All three legs hit comfortably', 'Parlay', (SELECT id FROM reports WHERE slug = 'week-1-monday-2025'));

-- Week 2 Sunday (Sep 14, 2025)
INSERT INTO bets (title, description, stake, odds, decimal_odds, event_date, status, result_notes, category, report_id) VALUES
('Panthers +7', 'Panthers at Cardinals spread', 111.00, '-110', 1.909, '2025-09-14', 'won', 'Panthers covered in 22-27 loss', 'Spread', (SELECT id FROM reports WHERE slug = 'week-2-sunday-2025')),
('Broncos -2.5', 'Broncos at Colts spread', 250.00, '-110', 1.909, '2025-09-14', 'lost', 'Broncos lost outright 28-29 on late FG', 'Spread', (SELECT id FROM reports WHERE slug = 'week-2-sunday-2025')),
('Eagles -1.5', 'Eagles at Chiefs spread', 250.00, '-125', 1.800, '2025-09-14', 'won', 'Eagles won 20-17 in defensive battle', 'Spread', (SELECT id FROM reports WHERE slug = 'week-2-sunday-2025')),
('Falcons +3.5', 'Falcons at Vikings spread', 167.00, '-110', 1.909, '2025-09-14', 'won', 'Falcons upset Vikings 22-6 - dominated', 'Spread', (SELECT id FROM reports WHERE slug = 'week-2-sunday-2025')),
('2-leg Sharp Action Parlay', 'Panthers +7 & Broncos -2.5', 54.00, '+260', 3.600, '2025-09-14', 'lost', 'Broncos leg failed on late field goal', 'Parlay', (SELECT id FROM reports WHERE slug = 'week-2-sunday-2025')),
('4-leg Sunday Special', 'Panthers/Broncos/Eagles/Falcons spreads', 50.00, '+1200', 13.000, '2025-09-14', 'lost', 'Broncos killed the parlay', 'Parlay', (SELECT id FROM reports WHERE slug = 'week-2-sunday-2025'));

-- Week 8 Sunday - Recent big wins (Oct 26, 2025)
INSERT INTO bets (title, description, stake, odds, decimal_odds, event_date, status, result_notes, category, report_id) VALUES
('Bills -7.5', 'Bills home spread vs Browns', 136.00, '-110', 1.909, '2025-10-26', 'won', 'Bills dominated 34-10 - easy cover', 'Spread', (SELECT id FROM reports WHERE slug = 'week-8-sunday-2025')),
('Texans -2.5', 'Texans home spread vs Titans', 136.00, '-110', 1.909, '2025-10-26', 'won', 'Texans won 24-17 - covered comfortably', 'Spread', (SELECT id FROM reports WHERE slug = 'week-8-sunday-2025')),
('Eagles -7.5', 'Eagles vs Giants divisional game', 136.00, '-110', 1.909, '2025-10-26', 'won', 'Eagles crushed Giants 38-20', 'Spread', (SELECT id FROM reports WHERE slug = 'week-8-sunday-2025')),
('Patriots -7.5', 'Patriots home vs Browns', 136.00, '-110', 1.909, '2025-10-26', 'won', 'Patriots won 31-17 - solid cover', 'Spread', (SELECT id FROM reports WHERE slug = 'week-8-sunday-2025')),
('Buccaneers -4.5', 'Buccaneers home vs Saints', 136.00, '-110', 1.909, '2025-10-26', 'won', 'Bucs won 28-17 - covered with late TD', 'Spread', (SELECT id FROM reports WHERE slug = 'week-8-sunday-2025')),
('Josh Allen OVER 1.5 pass TDs', 'Bills QB prop at home', 100.00, '-140', 1.714, '2025-10-26', 'won', 'Allen threw 3 TDs - easy cash', 'Player Prop', (SELECT id FROM reports WHERE slug = 'week-8-sunday-2025')),
('Jaxon Smith-Njigba OVER 68.5 rec yards', 'Seahawks WR receiving yards', 90.00, '-115', 1.870, '2025-10-26', 'won', 'JSN exploded for 124 yards - star performance', 'Player Prop', (SELECT id FROM reports WHERE slug = 'week-8-sunday-2025')),
('Sam Darnold OVER 229.5 passing yards', 'Vikings QB passing yards', 70.00, '-110', 1.909, '2025-10-26', 'won', 'Darnold threw 318 yards - blowout', 'Player Prop', (SELECT id FROM reports WHERE slug = 'week-8-sunday-2025')),
('3-leg ML parlay', 'Eagles ML + Bills ML + Texans ML', 75.00, '+165', 2.650, '2025-10-26', 'won', 'All three favorites won - solid parlay', 'Parlay', (SELECT id FROM reports WHERE slug = 'week-8-sunday-2025')),
('Mid-Tier Spreads 3-leg', 'Eagles -7.5 + Bills -7.5 + Patriots -7.5', 250.00, '+600', 7.000, '2025-10-26', 'won', 'MASSIVE WIN! All three heavy favorites covered - $1,500 profit!', 'Parlay', (SELECT id FROM reports WHERE slug = 'week-8-sunday-2025'));
