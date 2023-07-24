async function getCategoryIds() {
  try {
    const response = await axios.get(
      "http://jservice.io/api/categories?count=100"
    ); // Fetch more categories to have a wider pool
    const categoryIds = response.data.map((category) => category.id);
    // Shuffle the categoryIds array to get a random selection
    const shuffledIds = _.shuffle(categoryIds);
    return shuffledIds.slice(0, 6); // Select the first 6 random categories
  } catch (error) {
    console.error("Error fetching category IDs:", error.message);
    return []; // Return an empty array if an error occurs
  }
}

document.addEventListener("DOMContentLoaded", () => {
  let categories = [];

  async function getCategory(catId) {
    let retries = 3; // Limit the number of retries for fetching a category

    while (retries > 0) {
      try {
        const response = await axios.get(
          `http://jservice.io/api/category?id=${catId}`
        );
        const clues = response.data.clues.map((clue) => ({
          question: clue.question,
          answer: clue.answer,
          showing: null,
        }));
        // Shuffle the clues array to present questions in random order
        const shuffledClues = _.shuffle(clues);
        return {
          title: response.data.title,
          clues: shuffledClues,
        };
      } catch (error) {
        console.error("Error fetching category data:", error.message);
        retries--;
      }
    }

    // If we reach here, it means we failed to fetch the category data after retries
    console.error(`Unable to fetch data for category with ID ${catId}`);
    return { title: "Unknown Category", clues: [] }; // Return a default category if an error occurs
  }

  const NUM_QUESTIONS_PER_CAT = 5;

  async function fillTable() {
    const table = document.getElementById("jeopardy");
    const thead = document.querySelector("#jeopardy thead");
    const tbody = document.querySelector("#jeopardy tbody");

    try {
      // Clear previous content
      thead.innerHTML = "";
      tbody.innerHTML = "";

      // Create table header row
      const headerRow = document.createElement("tr");

      for (const category of categories) {
        const th = document.createElement("th");
        th.textContent = category.title;
        headerRow.appendChild(th);
      }

      thead.appendChild(headerRow);

      // Create table body rows with questions
      for (let i = 0; i < NUM_QUESTIONS_PER_CAT; i++) {
        const bodyRow = document.createElement("tr");

        for (const category of categories) {
          const td = document.createElement("td");
          const clue = category.clues[i];

          // Set the question as the initial text content
          td.textContent = "?";
          td.clue = clue; // Assign clue data to the cell for later use
          td.addEventListener("click", () => handleClick(td.clue, td)); // Add click event handler
          bodyRow.appendChild(td);
        }

        tbody.appendChild(bodyRow);
      }
    } catch (error) {
      console.error("Error filling the table:", error.message);
    }
  }

  function handleClick(clue, td) {
    if (clue.showing === null) {
      // Show the question
      td.textContent = clue.question;
      clue.showing = "question";
    } else if (clue.showing === "question") {
      // Show the answer
      td.textContent = clue.answer;
      clue.showing = "answer";
    }
    // If currently 'answer', do nothing (ignore click)
  }

  function showLoadingView() {
    document.getElementById("start").disabled = true;
    document.getElementById("spin-container").style.display = "block";
  }

  function hideLoadingView() {
    document.getElementById("start").disabled = false;
    document.getElementById("spin-container").style.display = "none";
  }

  async function setupAndStart() {
    showLoadingView();

    // Get random category IDs
    const categoryIds = await getCategoryIds();

    // Fetch data for each category
    categories = await Promise.all(categoryIds.map(getCategory));

    // Fill the Jeopardy table
    fillTable();

    hideLoadingView();
  }

  document.getElementById("start").addEventListener("click", setupAndStart);
});
