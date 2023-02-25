import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Watchlist = () => {
  const [searchData, setsearchData] = useState([]);
  const [stockName, setstockName] = useState([]);

  const navigate = useNavigate();
  const userId = JSON.parse(localStorage.getItem("user"))._id;

  useEffect(() => {
    (async () => {
      let result = await fetch(
        `http://localhost:5000/watchlist?userId=${userId}`,
        {
          method: "get",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      result = await result.json();
      const watchlist = result.watchlist;

      let stockList = [];
      watchlist.map((data) => {
        const stocsymbol = data.stockName;
        const price = data.currentPrice;
        return stockList.push({ stock: stocsymbol, price: price });
      });
      setstockName(stockList);
    })();
  }, [userId]);

  // Handling stock Search
  const handleSearch = async (e) => {
    if (e.key === "Enter") {
      const searchWord = e.target.value;
      let result = await fetch(
        `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${searchWord}&apikey=UOASVEI0FTZC73M8`
      );
      result = await result.json();
      if (searchWord === "") {
        setsearchData([]);
      } else {
        setsearchData(result.bestMatches);
      }
    }
  };

  // Adding stocks to the watchlist
  const addToWatchlist = async (e) => {
    e.preventDefault();
    const searchword = e.target.getElementsByTagName("h4")[0].innerText;
    let result = await fetch(
      `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${searchword}&interval=5min&apikey=UOASVEI0FTZC73M8`
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
    // const userId = JSON.parse(localStorage.getItem("user"))._id; // fetch userId from local storage
    const res = await fetch("http://localhost:5000/watchlist", {
      method: "post",
      body: JSON.stringify({ userId, stock: symbol, price: LTP }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    // clear search data
    setsearchData([]);
    let inputField = document.querySelector(".inputfield");
    inputField.value = "";
    setstockName([...stockName, { stock: symbol, price: LTP }]);
  };

  // Remove stock from the watchlist
  const handleRemoveStock = async (stock) => {
    await fetch(`http://localhost:5000/watchlist`, {
      method: "DELETE",
      body: JSON.stringify({ userId, stock }),
      headers: { "Content-Type": "application/json" },
    });
    const updatedWatchlist = stockName.filter((data) => data.stock !== stock); // updating watchlist
    // Update the state with the new array
    setstockName(updatedWatchlist);
  };

  // Redirecting to the stock page
  const handleStockClick = (e) => {
    const stock = e.target.innerText;
    navigate(`/stock/${stock}`);
  };

  return (
    <div className="watchlist">
      <div className="search">
        <input
          className="inputfield"
          type="search"
          placeholder="Search stocks Eg:GOOGL "
          onKeyDown={handleSearch}
        ></input>
        {searchData.length !== 0 &&
          searchData.slice(0, 5).map((data, index) => {
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
      {stockName.map((data, i) => {
        return (
          <div className="stock-list" key={i + 1}>
            <h4 onClick={handleStockClick}>{data.stock}</h4>
            <h4>${data.price}</h4>
            <button
              onClick={() => {
                handleRemoveStock(data.stock);
              }}
            >
              -
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default Watchlist;
