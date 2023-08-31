// export async function getCategoriesFromUp() {
//   const url = `https://api.up.com.au/api/v1/categories`;
//   const response = await fetch(url, {
//     headers: {
//       Authorization: `Bearer ${UpApiKey}`,
//     },
//   });
//   const statusCode = response.status;
//   if (statusCode !== 200) {
//     console.log("Error getting URL: " + url);
//     console.log("Status code: " + statusCode);
//     console.log("Response: " + await response.text());
//     return null;
//   }
//   return response.json();
// }
// export async function getCategories(): Promise<UpTypes.CategoryDetails> {
//   const inputData: UpTypes.UpRootObjectArray = await getCategoriesFromUp();
//   const tree: UpTypes.CategoryTreeEntry[] = [];
//   // Create a map to store categories by ID
//   const categoriesMap = new Map<string, UpTypes.UpData>();
//   inputData.data.forEach((category) => {
//     categoriesMap.set(category.id, category);
//   });

//   // Iterate through each category and build the desired format
//   categoriesMap.forEach((category) => {
//     if (category.relationships.children.data.length > 0) {
//       tree.push({
//         id: category.id,
//         children: category.relationships.children.data.map((child) => ({
//           id: child.id,
//         })),
//       });
//     }
//   });
//   const names = new Map<string, string>();
//   categoriesMap.forEach((category) => {
//     names.set(category.id, category.attributes.name);
//   });
//   return { tree, names };
// }