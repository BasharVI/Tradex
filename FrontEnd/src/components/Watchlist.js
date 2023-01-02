import React, { useState } from "react";

const Watchlist = () => {
  const [searchData, setsearchData] = useState([]);

  const handleSearch = async (e) => {
    if (e.key === "Enter") {
      let searchWord = e.target.value;
      let result = await fetch(
        `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${searchWord}&apikey=UOASVEI0FTZC73M8`
      );
      result = await result.json();
      console.log(result.bestMatches);
      setsearchData(result.bestMatches);
    }
  };

  return (
    <div className="watchlist">
      <div className="search">
        <input
          type="search"
          placeholder="Search stocks Eg:GOOGL "
          onKeyDown={handleSearch}
        ></input>
        {searchData.map((data) => {
          return (
            <div className="stock-list">
              <h4>{Object.values(data)[0]}</h4>
              <span>{Object.values(data)[1]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Watchlist;
