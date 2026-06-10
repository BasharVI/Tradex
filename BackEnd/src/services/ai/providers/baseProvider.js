class BaseAIProvider {
  constructor({ name, model }) {
    this.name = name;
    this.model = model;
  }

  async generateJson() {
    throw new Error("Not implemented");
  }
}

module.exports = BaseAIProvider;
