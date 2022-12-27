import React from "react";

const Watchlist = () => {
  return (
    <div className="watchlist">
      <div className="search">
        <input type="search" placeholder="Search stocks Eg:TATASTEEL "></input>
      </div>

      <div className="stock-list">
        <h4>TATAMOTOR</h4>
        <span>BUY/SELL</span>
      </div>
      <div className="stock-list">
        <h4>RELIANCE </h4>
        <span>BUY/SELL</span>
      </div>
      <div className="stock-list">
        <h4>TATASTEEL</h4> <span>BUY/SELL</span>
      </div>
      <div className="stock-list">
        <h4>HDFCBANK </h4>
        <span>BUY/SELL</span>
      </div>
      <div className="stock-list">
        <h4>SBIN</h4> <span>BUY/SELL</span>
      </div>
      <div className="stock-list">
        <h4>HINDUNILVR</h4> <span>BUY/SELL</span>
      </div>
      <div className="stock-list">
        <h4>JSWSTEEL</h4> <span>BUY/SELL</span>
      </div>
      <div className="stock-list">
        <h4>TATACONSUM</h4> <span>BUY/SELL</span>
      </div>
      <div className="stock-list">
        <h4>ADANIPORT</h4> <span>BUY/SELL</span>
      </div>
    </div>
  );
};

export default Watchlist;
