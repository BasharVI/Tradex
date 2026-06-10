class IMarketDataProvider {
  // Fetch latest quote for a symbol (returns { symbol, lastPrice, timestamp, ... })
  async getQuote(symbol) {
    throw new Error("Not implemented");
  }

  // Fetch historical OHLC candles: { from, to, interval }
  async getHistorical(symbol, fromTs, toTs, interval) {
    throw new Error("Not implemented");
  }

  // Search instruments by query
  async search(query, limit = 20) {
    throw new Error("Not implemented");
  }

  // Optional: stream subscription — provider may implement
  async connectStream(handler) {
    // handler({ symbol, lastPrice, ... })
    throw new Error("Not implemented");
  }

  async disconnectStream() {
    throw new Error("Not implemented");
  }
}

module.exports = IMarketDataProvider;
