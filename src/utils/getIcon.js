// Function to get the icon based on the status
export function getIcon(status) {
  switch (status) {
    case 'confirmed':
      return 'done'
    case 'returned':
      return 'arrow_back'
    case 'quotation':
      return 'question_mark'
    case 'canceled':
      return 'close' // Use 'close' instead of 'X' for better compatibility
    case 'checked_out':
      return 'arrow_forward'
    case 'completed':
      return 'done_all' // Use 'check_circle' for double checkmarks
    default:
      return 'help' // Default to a help icon if the status is unknown
  }
}
