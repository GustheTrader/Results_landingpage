-- SQL INSERT statements for NFL betting data from PDFs
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
-- BETS TABLE - Individual wagers
-- ============================================

-- Week 1 Friday (Sep 5, 2025)
INSERT INTO bets (game_info, bet_type, selection, odds, stake, status, profit_loss, game_date, notes) VALUES
('Chiefs vs Chargers', 'prop', 'Travis Kelce receiving props', -110, 128.00, 'loss', -128.00, '2025-09-05', 'Week 1 Friday opening game'),
('Chiefs vs Chargers', 'parlay', 'Justin Herbert 3-leg parlay', 412, 128.00, 'win', 529.00, '2025-09-05', 'Big parlay hit on Herbert performance'),
('Chiefs vs Chargers', 'spread', 'Chargers +3.5', -110, 50.00, 'win', 50.00, '2025-09-05', 'Chargers covered in close game'),
('Chiefs vs Chargers', 'total', 'Under 47.5', -110, 55.00, 'loss', -55.00, '2025-09-05', 'Game went over total');

-- Week 1 Monday (Sep 9, 2025)
INSERT INTO bets (game_info, bet_type, selection, odds, stake, status, profit_loss, game_date, notes) VALUES
('Vikings vs Bears', 'prop', 'Aaron Jones O20 receiving yards', -114, 340.00, 'win', 298.25, '2025-09-09', 'Monday Night Football prop'),
('Vikings vs Bears', 'prop', 'Caleb Williams U218.5 passing yards', -110, 340.00, 'win', 309.09, '2025-09-09', 'Bears QB under hit'),
('Vikings vs Bears', 'prop', 'J.J. McCarthy U223.5 passing yards', -105, 340.00, 'win', 323.81, '2025-09-09', 'Vikings QB under cashed'),
('Vikings vs Bears', 'prop', 'Colston Loveland TD scorer', 180, 340.00, 'loss', -340.00, '2025-09-09', 'TD prop miss'),
('Vikings vs Bears', 'parlay', '3-team player props parlay', 286, 340.00, 'win', 972.40, '2025-09-09', 'Huge parlay win +9.74 units');

-- Week 2 Sunday (Sep 14, 2025)
INSERT INTO bets (game_info, bet_type, selection, odds, stake, status, profit_loss, game_date, notes) VALUES
('Panthers @ Cardinals', 'spread', 'Panthers +7', -110, 111.00, 'win', 100.91, '2025-09-14', 'Panthers covered in 27-22 loss'),
('Broncos @ Colts', 'spread', 'Broncos -2.5', -110, 250.00, 'loss', -250.00, '2025-09-14', 'Broncos lost outright 28-29'),
('Eagles @ Chiefs', 'spread', 'Eagles -1.5', -125, 250.00, 'win', 208.33, '2025-09-14', 'Eagles won 20-17'),
('Falcons @ Vikings', 'spread', 'Falcons +3.5', -110, 167.00, 'win', 151.82, '2025-09-14', 'Falcons won outright 22-6'),
('Multiple games', 'parlay', '2-leg Sharp Action (Panthers/Broncos)', 260, 54.00, 'loss', -54.00, '2025-09-14', 'Broncos leg failed'),
('Multiple games', 'parlay', '4-leg Sunday Special', 1200, 50.00, 'loss', -50.00, '2025-09-14', 'Broncos leg failed');

-- Week 3 Sunday (Sep 21, 2025)
INSERT INTO bets (game_info, bet_type, selection, odds, stake, status, profit_loss, game_date, notes) VALUES
('Seahawks @ Saints', 'spread', 'Seahawks -7.5', 105, 271.00, 'win', 284.55, '2025-09-21', 'Seahawks dominated 44-13'),
('49ers @ Cardinals', 'spread', '49ers -1.5', -105, 254.00, 'loss', -254.00, '2025-09-21', '49ers won by only 1 point'),
('Seahawks @ Saints', 'total', 'OVER 42.5', 100, 125.00, 'win', 125.00, '2025-09-21', '57 total points crushed over'),
('49ers @ Cardinals', 'total', 'OVER 43.5', -105, 118.00, 'loss', -118.00, '2025-09-21', 'Only 31 points scored'),
('Bears @ Cowboys', 'spread', 'Bears +1.5', -110, 193.00, 'win', 175.45, '2025-09-21', 'Bears won outright 31-14');

-- Week 4 Sunday (Sep 28, 2025) - Spreads & Totals Pool
INSERT INTO bets (game_info, bet_type, selection, odds, stake, status, profit_loss, game_date, notes) VALUES
('Ravens @ Chiefs', 'spread', 'Chiefs -2.5', -112, 71.43, 'win', 63.78, '2025-09-28', 'Chiefs won 37-20'),
('Jaguars @ 49ers', 'spread', 'Jaguars +3.5', -112, 71.43, 'win', 63.78, '2025-09-28', 'Jaguars upset 26-21'),
('Jaguars @ 49ers', 'total', 'OVER 45.5', -112, 71.43, 'win', 63.78, '2025-09-28', '47 points over'),
('Colts @ Rams', 'spread', 'Rams -3.5', -112, 71.43, 'win', 63.78, '2025-09-28', 'Rams won 27-20'),
('Colts @ Rams', 'total', 'OVER 49.5', -112, 71.43, 'loss', -71.43, '2025-09-28', 'Under 47 points'),
('Ravens @ Chiefs', 'total', 'OVER 49.5', -112, 71.43, 'win', 63.78, '2025-09-28', '57 points'),
('Packers @ Cowboys', 'spread', 'Packers -6.5', -112, 71.43, 'win', 63.78, '2025-09-28', 'Packers crushed 31-17');

-- Week 4 Sunday - Player Props Pool
INSERT INTO bets (game_info, bet_type, selection, odds, stake, status, profit_loss, game_date, notes) VALUES
('Packers @ Cowboys', 'prop', 'Jordan Love O267.5 pass yards', -112, 74.68, 'win', 66.68, '2025-09-28', 'Love threw 312 yards'),
('Ravens @ Chiefs', 'prop', 'Lamar Jackson O64.5 rush yards', -115, 56.33, 'win', 48.98, '2025-09-28', 'Jackson rushed 72 yards'),
('Colts @ Rams', 'prop', 'Jonathan Taylor U84.5 rush yards', -110, 66.46, 'win', 60.42, '2025-09-28', 'Taylor held to 68 yards'),
('Packers @ Cowboys', 'prop', 'Romeo Doubs Anytime TD', 185, 46.20, 'win', 85.47, '2025-09-28', 'Doubs TD cashed'),
('Bears @ Raiders', 'prop', 'Rome Odunze O67.5 rec yards', -110, 60.76, 'win', 55.24, '2025-09-28', 'Odunze 112 yards'),
('Ravens @ Chiefs', 'prop', 'Travis Kelce O58.5 rec yards', -120, 46.84, 'win', 39.03, '2025-09-28', 'Kelce 89 yards'),
('Jaguars @ 49ers', 'prop', 'Daniel Jones O251.5 pass yards', -105, 55.06, 'loss', -55.06, '2025-09-28', 'Jones 245 yards'),
('Bears @ Raiders', 'prop', 'Caleb Williams O1.5 pass TDs', -125, 42.41, 'win', 33.93, '2025-09-28', 'Williams 2 TDs'),
('Jaguars @ 49ers', 'prop', 'Travis Etienne O73.5 rush yards', -115, 51.27, 'win', 44.58, '2025-09-28', 'Etienne 82 yards');

-- Week 4 Sunday - Moneylines Pool
INSERT INTO bets (game_info, bet_type, selection, odds, stake, status, profit_loss, game_date, notes) VALUES
('Bears @ Raiders', 'moneyline', 'Bears ML', 115, 111.09, 'win', 127.75, '2025-09-28', 'Bears upset'),
('Packers @ Cowboys', 'moneyline', 'Cowboys ML', 270, 111.09, 'loss', -111.09, '2025-09-28', 'Cowboys lost at home'),
('Colts @ Rams', 'moneyline', 'Colts ML', 160, 111.09, 'loss', -111.09, '2025-09-28', 'Colts lost 20-27'),
('Jaguars @ 49ers', 'moneyline', 'Jaguars ML', 140, 55.63, 'win', 77.88, '2025-09-28', 'Jags upset 49ers'),
('Ravens @ Chiefs', 'moneyline', 'Ravens ML', -145, 111.09, 'loss', -111.09, '2025-09-28', 'Ravens blown out');

-- Week 5 Monday Night (Oct 6, 2025)
INSERT INTO bets (game_info, bet_type, selection, odds, stake, status, profit_loss, game_date, notes) VALUES
('Jaguars @ Chiefs', 'spread', 'Jaguars +3.5', -120, 286.00, 'win', 238.33, '2025-10-06', 'Jags won outright 31-28'),
('Jaguars @ Chiefs', 'total', 'UNDER 45.5', -105, 214.00, 'loss', -214.00, '2025-10-06', 'Shootout went over'),
('Jaguars @ Chiefs', 'prop', 'Travis Etienne Jr O65.5 rush yards', -114, 153.00, 'loss', -153.00, '2025-10-06', 'Only 49 yards'),
('Jaguars @ Chiefs', 'prop', 'Travis Etienne Jr Anytime TD', 135, 204.00, 'loss', -204.00, '2025-10-06', 'No TD'),
('Jaguars @ Chiefs', 'prop', 'Brenton Strange O41.5 rec yards', -114, 48.00, 'loss', -48.00, '2025-10-06', 'Injury - only 22 yards'),
('Jaguars @ Chiefs', 'prop', 'Travis Kelce O41.5 rec yards', -114, 83.00, 'win', 72.81, '2025-10-06', 'Kelce 61 yards'),
('Jaguars @ Chiefs', 'prop', 'Brian Thomas Jr O56.5 rec yards', -114, 13.00, 'win', 11.40, '2025-10-06', 'Thomas 80 yards'),
('Jaguars @ Chiefs', 'moneyline', 'Jaguars ML', 160, 1000.00, 'win', 1600.00, '2025-10-06', 'Massive upset win!'),
('Jaguars @ Chiefs', 'parlay', 'Defensive Domination 3-leg', 470, 90.00, 'loss', -90.00, '2025-10-06', 'Under leg failed'),
('Jaguars @ Chiefs', 'parlay', 'Jaguars Upset Special 3-leg', 950, 160.00, 'loss', -160.00, '2025-10-06', 'Etienne TD missed');

-- Week 5 Sunday Afternoon (Oct 5, 2025) - Spreads Pool
INSERT INTO bets (game_info, bet_type, selection, odds, stake, status, profit_loss, game_date, notes) VALUES
('Seahawks vs Buccaneers', 'spread', 'Seahawks -3.5', -115, 150.00, 'loss', -150.00, '2025-10-05', 'Seahawks lost 35-38'),
('Cardinals vs Titans', 'spread', 'Cardinals -7.5', -115, 175.00, 'loss', -175.00, '2025-10-05', 'Cardinals upset 21-22'),
('Commanders vs Chargers', 'spread', 'Commanders +2.5', -105, 75.00, 'win', 71.43, '2025-10-05', 'Commanders won 27-10'),
('Buccaneers vs Seahawks', 'total', 'UNDER 44.5', -105, 100.00, 'loss', -100.00, '2025-10-05', 'Shootout 73 points');

-- Week 5 Sunday - Moneylines Pool
INSERT INTO bets (game_info, bet_type, selection, odds, stake, status, profit_loss, game_date, notes) VALUES
('Seahawks vs Buccaneers', 'moneyline', 'Seahawks ML', -195, 300.00, 'loss', -300.00, '2025-10-05', 'Heavy favorite lost'),
('Cardinals vs Titans', 'moneyline', 'Cardinals ML', -500, 400.00, 'loss', -400.00, '2025-10-05', 'Huge upset'),
('Lions vs Bengals', 'moneyline', 'Lions ML', -650, 250.00, 'win', 38.46, '2025-10-05', 'Lions won 37-24'),
('Bills vs Patriots', 'moneyline', 'Bills ML (hedge)', -500, 50.00, 'loss', -50.00, '2025-10-05', 'Patriots upset');

-- Week 6 Afternoon (Oct 13, 2025)
INSERT INTO bets (game_info, bet_type, selection, odds, stake, status, profit_loss, game_date, notes) VALUES
('Bengals @ Packers', 'spread', 'Bengals +13.5', -120, 55.00, 'win', 45.83, '2025-10-13', 'Bengals covered 18-27'),
('49ers @ Buccaneers', 'spread', '49ers +3.5', -115, 50.00, 'loss', -50.00, '2025-10-13', '49ers lost 19-30'),
('Titans @ Raiders', 'total', 'UNDER 41.5', -110, 40.00, 'win', 36.36, '2025-10-13', 'Raiders won 20-10'),
('Lions @ Chiefs', 'spread', 'Lions +2.5', 100, 45.00, 'loss', -45.00, '2025-10-13', 'Lions lost 17-30'),
('Titans @ Raiders', 'spread', 'Titans +3.5', 100, 25.00, 'loss', -25.00, '2025-10-13', 'Titans lost by 10'),
('Lions @ Chiefs', 'moneyline', 'Lions ML', 130, 50.00, 'loss', -50.00, '2025-10-13', 'Chiefs won'),
('49ers @ Buccaneers', 'moneyline', '49ers ML', 160, 45.00, 'loss', -45.00, '2025-10-13', 'Buccaneers upset');

-- Week 6 Monday Night (Oct 13, 2025) - Spreads
INSERT INTO bets (game_info, bet_type, selection, odds, stake, status, profit_loss, game_date, notes) VALUES
('Bears @ Commanders', 'spread', 'Commanders -5.5', -105, 250.00, 'loss', -250.00, '2025-10-13', 'Bears won 25-24'),
('Bills @ Falcons', 'spread', 'Bills +3.5', -110, 187.50, 'loss', -187.50, '2025-10-13', 'Bills lost 14-24'),
('Bills @ Falcons', 'total', 'UNDER 49.5', -110, 140.62, 'win', 127.84, '2025-10-13', 'Low scoring 38 points');

-- Week 6 Monday Night - Player Props
INSERT INTO bets (game_info, bet_type, selection, odds, stake, status, profit_loss, game_date, notes) VALUES
('Bills @ Falcons', 'prop', 'Bijan Robinson O31.5 rec yards', -120, 125.00, 'win', 104.17, '2025-10-13', 'Robinson 68 rec yards'),
('Bills @ Falcons', 'prop', 'Michael Penix Jr U1.5 pass TDs', -170, 93.75, 'win', 55.15, '2025-10-13', 'Penix 1 TD'),
('Bears @ Commanders', 'prop', 'D''Andre Swift O16.5 rec yards', -115, 70.31, 'win', 61.14, '2025-10-13', 'Swift 67 rec yards'),
('Bills @ Falcons', 'prop', 'Tyler Allgeier O30.5 rush yards', -110, 52.73, 'win', 47.94, '2025-10-13', 'Allgeier 32 yards'),
('Bears @ Commanders', 'prop', 'Zach Ertz O3.5 receptions', -115, 37.48, 'win', 32.59, '2025-10-13', 'Ertz 6 catches'),
('Bills @ Falcons', 'prop', 'James Cook Anytime TD', 155, 20.73, 'loss', -20.73, '2025-10-13', 'Cook no TD'),
('Bears @ Commanders', 'prop', 'Rome Odunze Anytime TD', 140, 12.93, 'loss', -12.93, '2025-10-13', 'Odunze no TD');

-- Week 6 Monday Night - Parlays
INSERT INTO bets (game_info, bet_type, selection, odds, stake, status, profit_loss, game_date, notes) VALUES
('Multiple games', 'parlay', 'B. Robinson rec OVER + Penix TDs UNDER', 191, 125.00, 'win', 238.75, '2025-10-13', '2-leg parlay hit'),
('Multiple games', 'parlay', 'Same combo second unit', 191, 62.50, 'win', 119.38, '2025-10-13', 'Duplicate parlay');

-- Week 7 Sunday (Oct 19, 2025)
INSERT INTO bets (game_info, bet_type, selection, odds, stake, status, profit_loss, game_date, notes) VALUES
('Texans @ Lions', 'total', 'TB/DET Over 54.5', -110, 202.00, 'loss', -202.00, '2025-10-19', 'Under total points'),
('Texans @ Lions', 'prop', 'Jaxon Smith-Njigba O87.5 rec yards', -115, 247.50, 'win', 215.22, '2025-10-19', 'Smith-Njigba crushed it'),
('Texans @ Lions', 'prop', 'Baker Mayfield O252.5 pass yards', -115, 186.80, 'loss', -186.80, '2025-10-19', 'Mayfield under'),
('Texans @ Lions', 'prop', 'Amon-Ra St. Brown O6.5 receptions', -110, 144.00, 'loss', -144.00, '2025-10-19', 'St. Brown under'),
('Texans @ Lions', 'prop', 'Jared Goff O249.5 pass yards', -110, 118.00, 'loss', -118.00, '2025-10-19', 'Goff under'),
('Texans @ Lions', 'prop', 'Nico Collins U73.5 rec yards', -110, 118.00, 'win', 107.27, '2025-10-19', 'Collins under hit'),
('Texans @ Lions', 'prop', 'Rachaad White O74.5 rush+rec yards', -110, 76.00, 'loss', -76.00, '2025-10-19', 'White under'),
('Texans @ Lions', 'prop', 'CJ Stroud U227.5 pass yards', -110, 76.00, 'loss', -76.00, '2025-10-19', 'Stroud over'),
('Texans @ Lions', 'prop', 'Jahmyr Gibbs O61.5 rush yards', -110, 32.50, 'win', 28.26, '2025-10-19', 'Gibbs over'),
('Texans @ Lions', 'moneyline', 'Texans ML', 150, 133.33, 'loss', -133.33, '2025-10-19', 'Texans upset loss');

-- Week 8 Sunday (Oct 26, 2025) - Spreads
INSERT INTO bets (game_info, bet_type, selection, odds, stake, status, profit_loss, game_date, notes) VALUES
('Multiple games', 'spread', 'Bengals -5.5', -110, 136.00, 'loss', -136.00, '2025-10-26', 'Bengals failed to cover'),
('Multiple games', 'spread', 'Falcons -6.5', -110, 127.00, 'loss', -127.00, '2025-10-26', 'Falcons failed to cover'),
('Multiple games', 'spread', 'Bills -7.5', -110, 136.00, 'win', 123.64, '2025-10-26', 'Bills covered'),
('Multiple games', 'spread', 'Texans -2.5', -110, 136.00, 'win', 123.64, '2025-10-26', 'Texans covered'),
('Multiple games', 'spread', 'Eagles -7.5', -110, 136.00, 'win', 123.64, '2025-10-26', 'Eagles covered'),
('Giants @ Eagles', 'total', 'OVER 43.5', -110, 27.00, 'win', 24.55, '2025-10-26', 'High scoring game'),
('Multiple games', 'spread', 'Patriots -7.5', -110, 136.00, 'win', 123.64, '2025-10-26', 'Patriots covered'),
('Browns @ Patriots', 'total', 'OVER 40.5', -110, 27.00, 'win', 24.55, '2025-10-26', 'Over hit'),
('Multiple games', 'spread', 'Buccaneers -4.5', -110, 136.00, 'win', 123.64, '2025-10-26', 'Buccaneers covered');

-- Week 8 Sunday - Player Props
INSERT INTO bets (game_info, bet_type, selection, odds, stake, status, profit_loss, game_date, notes) VALUES
('Multiple games', 'prop', 'Josh Allen O1.5 pass TDs', -140, 100.00, 'win', 71.43, '2025-10-26', 'Allen 2 TDs'),
('Multiple games', 'prop', 'Jared Goff O262.5 pass yards', -115, 90.00, 'loss', -90.00, '2025-10-26', 'Goff 236 yards'),
('Multiple games', 'prop', 'Kyler Murray O1.5 total TDs', -125, 100.00, 'loss', -100.00, '2025-10-26', 'Murray 1 TD'),
('Multiple games', 'prop', 'Jaxon Smith-Njigba O68.5 rec yards', -115, 90.00, 'win', 78.26, '2025-10-26', 'Smith-Njigba over 100'),
('Multiple games', 'prop', 'Sam Darnold O229.5 pass yards', -110, 70.00, 'win', 63.64, '2025-10-26', 'Darnold over 300'),
('Multiple games', 'prop', 'Kenneth Walker III O72.5 rush yards', -115, 50.00, 'loss', -50.00, '2025-10-26', 'Walker under');

-- Week 8 Sunday - Parlays
INSERT INTO bets (game_info, bet_type, selection, odds, stake, status, profit_loss, game_date, notes) VALUES
('Multiple games', 'parlay', '3-leg spread parlay (Seahawks/Cardinals/Lions)', 600, 50.00, 'loss', -50.00, '2025-10-26', 'Seahawks and Cardinals failed'),
('Multiple games', 'parlay', '3-leg under parlay', 650, 50.00, 'loss', -50.00, '2025-10-26', 'High scoring games'),
('Multiple games', 'parlay', '3-leg player props parlay', 450, 75.00, 'loss', -75.00, '2025-10-26', 'Goff and Murray missed'),
('Multiple games', 'parlay', '3-leg moneyline parlay (Eagles/Bills/Texans)', 165, 75.00, 'win', 123.75, '2025-10-26', 'Solid 3-leg ML hit'),
('Multiple games', 'parlay', 'Mid-Tier Spreads 3-leg (Eagles/Bills/Patriots)', 600, 250.00, 'win', 1500.00, '2025-10-26', 'Huge parlay win!');

-- Week 7 Sunday - Moneylines (additional from week 8 pdf)
INSERT INTO bets (game_info, bet_type, selection, odds, stake, status, profit_loss, game_date, notes) VALUES
('Multiple games', 'moneyline', 'Colts ML @ Chargers', 120, 192.90, 'win', 231.48, '2025-10-20', 'Colts won 38-24'),
('Vikings @ Eagles', 'moneyline', 'Vikings ML', 120, 184.22, 'loss', -184.22, '2025-10-20', 'Eagles won 28-22'),
('Bears vs Saints', 'moneyline', 'Bears ML', -210, 199.04, 'win', 94.78, '2025-10-20', 'Bears won 26-14'),
('Panthers @ Jets', 'moneyline', 'Panthers ML', -120, 167.71, 'win', 139.76, '2025-10-20', 'Panthers won 13-6'),
('Browns vs Dolphins', 'moneyline', 'Browns ML', -140, 120.86, 'win', 86.33, '2025-10-20', 'Browns won 31-6'),
('Multiple games', 'parlay', 'Chiefs ML + Eagles ML', 180, 135.27, 'win', 243.49, '2025-10-20', '2-leg ML parlay');

