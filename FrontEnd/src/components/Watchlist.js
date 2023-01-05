import React, { useState } from "react";

const Watchlist = () => {
  const [searchData, setsearchData] = useState([]);
  const [stockPrice, setstockPrice] = useState([]);
  const [stockName, setstockName] = useState([]);
  const handleSearch = async (e) => {
    if (e.key === "Enter") {
      const searchWord = e.target.value;
      let result = await fetch(
        `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${searchWord}&apikey=UOASVEI0FTZC73M8`
      );
      result = await result.json();
      setsearchData(result.bestMatches);
    }
  };

  const addToWatchlist = async (e) => {
    e.preventDefault();
    const searchword = e.target.getElementsByTagName("h4")[0].innerText;
    let result = await fetch(
      `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${searchword}&interval=5min&apikey=UOASVEI0FTZC85M8`
    );
    result = await result.json();

    const [symbol, LTP] = Object.values(result).map((data, index) => {
      if (index === 0) {
        const stock = Object.values(data)[1];
        return stock;
      } else if (index === 1) {
        const price = Object.values(data)[1];
        return Object.values(price)[3];
      } else {
        return null;
      }
    });
    // let action = await fetch("localhost:5000/watchlist", {
    //   method: "post",
    //   body: JSON.stringify({ symbol, LTP }),
    //   headers: {
    //     "Content-Type": "application/json",
    //   },
    // });

    // action = await action.json();
    // console.log(action);
    setstockName(symbol);
    setstockPrice(LTP);
    // console.log(LTP);
    // console.log(symbol);
  };

  return (
    <div className="watchlist">
      <div className="search">
        <input
          type="search"
          placeholder="Search stocks Eg:GOOGL "
          onKeyDown={handleSearch}
        ></input>
        {searchData.map((data, index) => {
          return (
            <form key={index + 1} onSubmit={addToWatchlist}>
              <div className="search-list">
                <h4>{Object.values(data)[0]}</h4>
                <span>{Object.values(data)[1]}</span>
                <button type="submit">+</button>
              </div>
            </form>
          );
        })}
      </div>

      <div className="stock-list">
        <h4>{stockName}</h4>
        <h4>${stockPrice}</h4>
      </div>
    </div>
  );
};

export default Watchlist;
