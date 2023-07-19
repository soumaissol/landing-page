const delay = (ms) => new Promise((res) => setTimeout(res, ms));

document.addEventListener("alpine:init", () => {
  const UNEXPECTED_ERROR =
    "Desculpe, ocorreu um erro inesperado. Por favor, tente mais tarde";
  const PUBLIC_API_BASE_URL =
    "https://q8klm53d43.execute-api.us-east-1.amazonaws.com/Prod";

  const BrReais = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  const getCachedData = (key) => {
    const cachedItem = localStorage.getItem(key);
    if (cachedItem) {
      const { value, expiration } = JSON.parse(cachedItem);
      const currentTime = Date.now();
      if (currentTime < expiration) {
        // The cached value is still valid
        return value;
      }
    }
    return null;
  };

  const calculate = async ({
    energyConsumption,
    zipCode,
    powerDistributorId,
    email,
  }) => {
    const key = `${energyConsumption}_${zipCode}_${powerDistributorId}`;

    const cachedItem = getCachedData(key);
    if (cachedItem) {
      console.log("Cached value:", cachedItem);
      await delay(500);
      return cachedItem;
    } else {
      console.log("No valid cached value found.");
      try {
        const response = await fetch(
          `${PUBLIC_API_BASE_URL}/simulations/calculate`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({
              energyConsumption,
              powerDistributorId,
              email,
              zip: zipCode,
            }),
          }
        );

        const data = await response.json();
        const expirationTime = Date.now() + 24 * 60 * 60 * 1000; // 24 hours from now
        const newItem = { value: data, expiration: expirationTime };
        localStorage.setItem(key, JSON.stringify(newItem));

        console.log("Fetched API data:", data);
        return data;
      } catch (error) {
        console.log("Error fetching API data:", error);
        return null;
      }
    }
  };

  Alpine.data("simulationForm", () => ({
    defaultButtonText: "",
    loading: false,
    buttonText: "",
    powerDistributors: [],
    zipCode: "",
    energyConsumption: "",
    powerDistributorId: "",
    email: "fake@email.com",
    payback: null,
    monthlyLoanInstallmentAmount: null,
    monthlyLoanInstallments: null,
    payback: null,
    init() {
      const urlParams = new URLSearchParams(window.location.search);
      this.energyConsumption = urlParams.get("energyConsumption") || "";
      this.zipCode = urlParams.get("zipCode") || "";
      this.powerDistributorId = urlParams.get("powerDistributorId") || "";

      if (this.zipCode) {
        this.fetchPowerDistributors();
      }

      if (this.zipCode && this.energyConsumption && this.powerDistributorId) {
        this.calculate();
      }
    },
    setLoading(loading, loadingText = "Carregando...") {
      this.loading = loading;

      if (loading) {
        this.buttonText = loadingText;
      } else {
        this.buttonText = this.defaultButtonText;
      }
    },
    async sendToSimulation() {
      this.setLoading(true, "Calculando...");
      const result = await calculate({
        energyConsumption: this.energyConsumption,
        zipCode: this.getZipCode(),
        powerDistributorId: this.powerDistributorId,
        email: this.email,
      });
      this.setLoading(false);

      if (!result) {
        return alert(UNEXPECTED_ERROR);
      }

      const queryParams = new URLSearchParams();
      queryParams.set('zipCode', this.zipCode);
      queryParams.set('energyConsumption', this.energyConsumption);
      queryParams.set('powerDistributorId', this.powerDistributorId);

      const queryUrl = `/simulation?${queryParams.toString()}`;
      window.location.href = queryUrl;
    },
    async calculate() {
      this.setLoading(true, "Calculando...");
      const result = await calculate({
        energyConsumption: this.energyConsumption,
        zipCode: this.getZipCode(),
        powerDistributorId: this.powerDistributorId,
        email: this.email,
      });
      this.setLoading(false);

      if (!result) {
        return alert(UNEXPECTED_ERROR);
      }

      this.updateResult(result);
    },
    updateResult(result) {
      this.monthlyLoanInstallmentAmount = BrReais.format(
        result.monthlyLoanInstallmentAmount
      );
      this.monthlyLoanInstallments = `${result.monthlyLoanInstallments} meses`;

      const paybackYears = Math.floor(result.paybackInMonths / 12);
      const paybackMonths = result.paybackInMonths % 12;
      const paybackArray = [];

      if (paybackYears > 0) {
        paybackArray.push(`${paybackYears} anos`);
      }

      if (paybackYears > 0 && paybackMonths > 0) {
        paybackArray.push("e");
      }

      if (paybackMonths > 0) {
        paybackArray.push(`${paybackMonths} meses`);
      }

      this.payback = paybackArray.join(" ");
    },
    getZipCode() {
      return this.zipCode.replaceAll(/[-]/gi, "");
    },
    async fetchPowerDistributors() {
      this.setLoading(true);

      try {
        const response = await fetch(
          `${PUBLIC_API_BASE_URL}/simulations/power-distributors/${this.getZipCode()}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
          }
        );

        const result = await response.json();
        this.powerDistributors = result.powerDistributors;
      } catch (error) {
        alert(UNEXPECTED_ERROR);
      }

      this.setLoading(false);
    },
  }));
});
