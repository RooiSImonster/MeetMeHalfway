
export const styles = {
  layout: {
    pageContainer: "min-h-screen flex flex-col bg-gray-50 text-gray-900",
    header: "bg-white border-b border-gray-200 sticky top-0 z-20",
    headerContent: "max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between",
    mainContent: "flex-grow max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full h-full",
    gridContainer: "grid grid-cols-1 lg:grid-cols-12 gap-6 h-full items-start",
    leftColumn: "lg:col-span-3 space-y-6",
    centerColumn: "lg:col-span-6 flex flex-col gap-6",
    rightColumn: "lg:col-span-3 flex flex-col gap-6",
  },
  
  card: {
    container: "bg-white rounded-2xl shadow-sm border border-gray-100 p-6",
    infoBox: "bg-blue-50 rounded-xl p-5 border border-blue-100",
    mapContainer: "bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-[350px] lg:h-[600px] relative z-0",
    resultsWrapper: "bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[350px] lg:h-[600px]",
  },

  // Shared component styles for consistency
  component: {
    // Used for FriendItem and PlaceCard
    listItem: "group bg-white rounded-xl border border-gray-100 p-3 transition-all duration-200 hover:border-indigo-300 hover:shadow-md",
    listItemSelected: "group bg-indigo-50/30 rounded-xl border-2 border-indigo-500 p-3 transition-all duration-200 shadow-md",
    listItemEditing: "bg-white rounded-xl shadow-sm border-2 border-indigo-100 p-3 space-y-3 animate-in fade-in zoom-in-95 duration-200",
    
    avatar: "shrink-0 w-10 h-10 rounded-full bg-indigo-600 border-2 border-white shadow-sm flex items-center justify-center text-lg select-none ring-1 ring-gray-100",
    
    // Small icon buttons
    iconButton: "p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors",
    iconButtonDanger: "p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors",
    
    // Tags
    tagBase: "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border",
    tagGray: "bg-gray-100 text-gray-600 border-gray-200",
    tagGreen: "bg-emerald-50 text-emerald-700 border-emerald-100",
    tagBlue: "bg-blue-50 text-blue-700 border-blue-100",
    tagPurple: "bg-purple-50 text-purple-700 border-purple-100",
  },

  typography: {
    h1: "text-xl font-bold tracking-tight text-gray-900",
    h2: "text-lg font-semibold mb-4 flex items-center gap-2",
    h3: "text-blue-900 font-semibold mb-2 text-sm",
    sectionTitle: "text-xl font-bold text-gray-900 mb-6 flex items-center gap-2 border-b border-gray-100 pb-4",
    subHeader: "text-lg font-semibold text-gray-900 mb-2 px-1",
    bodySmall: "text-blue-700 text-xs leading-relaxed",
    errorText: "mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100",
    emptyState: "text-center p-4 text-gray-400 text-sm",
    
    // Item specific
    label: "text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block",
    itemTitle: "text-sm font-semibold text-gray-900 leading-tight",
    itemSubtitle: "text-xs text-gray-500 font-medium",
    link: "text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 transition-colors",
  },

  input: {
    group: "relative group",
    label: "block text-xs font-medium text-gray-500 mb-1 ml-1",
    wrapper: "flex gap-2",
    container: "relative flex-grow",
    field: "w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm placeholder:text-gray-400",
    iconLeft: "absolute left-3 top-1/2 -translate-y-1/2 text-gray-400",
    dropdown: "absolute z-50 left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-100 max-h-60 overflow-y-auto suggestions-list",
    dropdownItem: "w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-start gap-2",
    loader: "absolute right-3 top-1/2 -translate-y-1/2",
  },

  filter: {
    container: "flex flex-wrap gap-2 mb-2 px-1",
    pill: (selected: boolean) => `
      px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer select-none
      ${selected 
        ? 'bg-indigo-50 border-2 border-indigo-600 text-indigo-700' 
        : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600 hover:bg-gray-50'
      }
    `
  },

  button: {
    primary: (disabled: boolean) => `w-full py-3 px-4 rounded-xl text-white font-medium text-sm shadow-md transition-all flex items-center justify-center gap-2 ${disabled ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg transform hover:-translate-y-0.5'}`,
    secondary: "w-full py-2 border-2 border-dashed border-gray-200 rounded-lg text-gray-500 hover:border-indigo-300 hover:text-indigo-600 text-sm font-medium transition-colors flex items-center justify-center gap-2",
    reset: "text-sm text-gray-500 hover:text-indigo-600 font-medium transition-colors",
    iconContainer: "bg-indigo-600 p-2 rounded-lg text-white",
    save: "px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center gap-1",
    cancel: "px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors",
  },
  
  icon: {
    base: "w-5 h-5",
    small: "w-4 h-4",
    nav: "w-5 h-5 text-indigo-500",
  }
};
