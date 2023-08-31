//create am pbject of type Uptypes.CategoryDetails, and make it the default export
export default {
  tree: [
    {
      id: "good-life",
      children: [
        { id: "games-and-software" },
        { id: "booze" },
        { id: "events-and-gigs" },
        { id: "hobbies" },
        { id: "holidays-and-travel" },
        { id: "lottery-and-gambling" },
        { id: "pubs-and-bars" },
        { id: "restaurants-and-cafes" },
        { id: "takeaway" },
        { id: "tobacco-and-vaping" },
        { id: "tv-and-music" },
        { id: "adult" },
      ],
    },
    {
      id: "personal",
      children: [
        { id: "family" },
        { id: "clothing-and-accessories" },
        { id: "education-and-student-loans" },
        { id: "fitness-and-wellbeing" },
        { id: "gifts-and-charity" },
        { id: "hair-and-beauty" },
        { id: "health-and-medical" },
        { id: "investments" },
        { id: "life-admin" },
        { id: "mobile-phone" },
        { id: "news-magazines-and-books" },
        { id: "technology" },
      ],
    },
    {
      id: "home",
      children: [
        { id: "groceries" },
        { id: "homeware-and-appliances" },
        { id: "internet" },
        { id: "home-maintenance-and-improvements" },
        { id: "pets" },
        { id: "home-insurance-and-rates" },
        { id: "rent-and-mortgage" },
        { id: "utilities" },
      ],
    },
    {
      id: "transport",
      children: [
        { id: "car-insurance-and-maintenance" },
        { id: "cycling" },
        { id: "fuel" },
        { id: "parking" },
        { id: "public-transport" },
        { id: "car-repayments" },
        { id: "taxis-and-share-cars" },
        { id: "toll-roads" },
      ],
    },
  ],
  names: new Map<string, string>([
    ["games-and-software", "Apps, Games & Software"],
    ["car-insurance-and-maintenance", "Car Insurance, Rego & Maintenance"],
    ["family", "Children & Family"],
    ["good-life", "Good Life"],
    ["groceries", "Groceries"],
    ["booze", "Booze"],
    ["clothing-and-accessories", "Clothing & Accessories"],
    ["cycling", "Cycling"],
    ["homeware-and-appliances", "Homeware & Appliances"],
    ["personal", "Personal"],
    ["education-and-student-loans", "Education & Student Loans"],
    ["events-and-gigs", "Events & Gigs"],
    ["fuel", "Fuel"],
    ["home", "Home"],
    ["internet", "Internet"],
    ["fitness-and-wellbeing", "Fitness & Wellbeing"],
    ["hobbies", "Hobbies"],
    ["home-maintenance-and-improvements", "Maintenance & Improvements"],
    ["parking", "Parking"],
    ["transport", "Transport"],
    ["gifts-and-charity", "Gifts & Charity"],
    ["holidays-and-travel", "Holidays & Travel"],
    ["pets", "Pets"],
    ["public-transport", "Public Transport"],
    ["hair-and-beauty", "Hair & Beauty"],
    ["lottery-and-gambling", "Lottery & Gambling"],
    ["home-insurance-and-rates", "Rates & Insurance"],
    ["car-repayments", "Repayments"],
    ["health-and-medical", "Health & Medical"],
    ["pubs-and-bars", "Pubs & Bars"],
    ["rent-and-mortgage", "Rent & Mortgage"],
    ["taxis-and-share-cars", "Taxis & Share Cars"],
    ["investments", "Investments"],
    ["restaurants-and-cafes", "Restaurants & Cafes"],
    ["toll-roads", "Tolls"],
    ["utilities", "Utilities"],
    ["life-admin", "Life Admin"],
    ["takeaway", "Takeaway"],
    ["mobile-phone", "Mobile Phone"],
    ["tobacco-and-vaping", "Tobacco & Vaping"],
    ["news-magazines-and-books", "News, Magazines & Books"],
    ["tv-and-music", "TV, Music & Streaming"],
    ["adult", "Adult"],
    ["technology", "Technology"],
  ]),
};