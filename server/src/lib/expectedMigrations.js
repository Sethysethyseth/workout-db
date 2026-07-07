// Append a name here in the SAME commit that adds a migration directory.
// The schema sentinel refuses to boot if any listed migration is missing from
// the target database (see docs/specs/schema-sentinel.md).
module.exports.EXPECTED_MIGRATIONS = [
  "20260307180442_init",
  "20260309174807_add_workout_templates",
  "20260311180000_add_session_exercises",
  "20260316120000_add_session_started_completed_at",
  "20260323120000_add_template_sets",
  "20260324193728_add_block_templates",
  "20260325120000_template_display_options",
  "20260325143000_block_weeks",
  "20260415031507_add_feedback",
  "20260415032258_add_workout_session_name",
  "20260503185000_allow_decimal_reps",
  "20260603140000_add_user_username",
  "20260704120000_add_workout_set_side",
  "20260704130000_add_user_exercise",
];
