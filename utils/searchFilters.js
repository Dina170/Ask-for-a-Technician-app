// utils/searchFilters.js
const mongoose = require("mongoose");

/**
 * Builds a search query for regex-based search and optional filters
 * @param {Object} options - Options to build the query
 * @param {string} options.search - Text to search by name field
 * @param {string} options.neighborhood - ID of the neighborhood
 * @param {string} nameField - The name of the field to search in (e.g., 'name')
 * @returns {Object} MongoDB query object
 */
const buildSearchQuery = ({ search, neighborhood }, nameField = "name" , allowNeighborhoodFilter = true) => {
    const query = {};

    if (search) {
        query[nameField] = { $regex: search, $options: "i" };
    }

    if (allowNeighborhoodFilter && neighborhood && mongoose.Types.ObjectId.isValid(neighborhood) && neighborhood !== "all") {
        query.neighborhoodName = neighborhood;
    }

    return query;
};

module.exports = { buildSearchQuery };
