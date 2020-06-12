import crypto from "crypto";

export const parksByState = {
  AK: [
    "Denali National Park",
    "Gates of the Arctic National Park",
    "Glacier Bay National Park",
    "Katmai National Park",
    "Kenai Fjords National Park",
    "Kobuk Valley National Park",
    "Lake Clark National Park",
    "Wrangell-St. Elias National Park",
  ],
  AZ: [
    "Grand Canyon National Park",
    "Petrified Forest National Park",
    "Saguaro National Park",
  ],
  AR: ["Hot Springs National Park"],
  CA: [
    "Channel Islands National Park",
    "Death Valley National Park, Californ",
    "Joshua Tree National Park",
    "Kings Canyon National Park",
    "Lassen Volcanic National Park",
    "Pinnacles National Park",
    "Redwood National Park",
    "Sequoia National Park",
    "Yosemite National Park",
  ],
  CO: [
    "Black Canyon of the Gunnison National Park",
    "Great Sand Dunes National Park",
    "Mesa Verde National Park",
    "Rocky Mountain National Park",
  ],
  FL: [
    "Biscayne National Park",
    "Dry Tortugas National Park",
    "Everglades National Park",
  ],
  HI: ["Haleakala National Park", "Hawai'i Volcanoes National Park"],
  ID: ["Yellowstone National Park"],
  KY: ["Mammoth Cave National Park"],
  IL: ["Gateway Arch National Park"],
  IN: ["Indiana Dunes National Park"],
  ME: ["Acadia National Park"],
  MI: ["Isle Royale National Park"],
  MN: ["Voyageurs National Park"],
  MO: ["Gateway Arch National Park"],
  MT: ["Glacier National Park", "Yellowstone National Park"],
  NV: ["Death Valley National Park", "Great Basin National Park"],
  NM: ["Carlsbad Caverns National Park"],
  ND: ["Theodore Roosevelt National Park"],
  NC: ["Great Smoky Mountains National Park"],
  OH: ["Cuyahoga Valley National Park"],
  OR: ["Crater Lake National Park"],
  SC: ["Congaree National Park"],
  SD: ["Badlands National Park", "Wind Cave National Park"],
  TN: ["Great Smoky Mountains National Park"],
  TX: ["Big Bend National Park", "Guadalupe Mountains National Park"],
  UT: [
    "Arches National Park",
    "Bryce Canyon National Park",
    "Canyonlands National Park",
    "Capitol Reef National Park",
    "Zion National Park",
  ],
  VI: ["Virgin Islands National Park", ,],
  VA: ["Shenandoah National Park"],
  WA: [
    "Mount Rainier National Park",
    "North Cascades National Park",
    "Olympic National Park",
  ],
  WY: ["Grand Teton National Park", "Yellowstone National Park"],
};

export const findParkMatchByName = (name) => {
  // Create a hash of the name we can use for our "algorithm"
  const hashedName = crypto
    .createHash("sha256")
    .update(name)
    .digest("hex")
    .substring(0, 6);

  // Convert it into base 16
  const nameBase16 = parseInt(hashedName, 16);

  // Create a maximum base 16 value (of 6 digits) we can compare against
  const maxBase16 = parseInt("ffffff", 16);

  // Convert our name into a value between 0 and 1
  const quotient = nameBase16 / maxBase16;

  // Get a flat list of our parks
  const parks = Object.keys(parksByState).reduce((parkList, state) => {
    return parkList.concat(
      parksByState[state].map((park) => ({ name: park, state }))
    );
  }, []);

  // Grab an index from the parks that is mapped to our name
  const idx = Math.floor(quotient * parks.length);

  return parks[idx];
};
