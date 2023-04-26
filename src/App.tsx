import React, { useState, useEffect } from "react";
import "./App.css";

const XLSX = require("xlsx");

let uniq = (a: Iterable<any> | null | undefined) => [...new Set(a)];
let formatBusinesses = (businesses: (string[] | undefined)[]) => {
    const formattedBusinesses = businesses.map((business) => {
        if (business) {
            return [
                business[0].replace(/\s+/g, " ").trim(),
                business[1].replace(/\s+/g, " ").trim(),
                business[2].replace(/\s+/g, " ").trim(),
                business[3].replace(/\s+/g, " ").trim(),
                business[4].replace(/\s+/g, " ").trim(),
            ];
        } else {
            return ["", "", "", "", ""];
        }
    });
    return formattedBusinesses;
};

let fetchData = async (
    setStatus: React.Dispatch<React.SetStateAction<string>>
) => {
    console.log("Fetching data...");
    setStatus("Fetching data...");

    const businesses: Element[] = [];
    const targetUrl = "https://www.sandyford.ie/business-directory/P";

    for (let i = 0; i < 70; i++) {
        let pagenumber = i * 8;
        if (i === 0) {
            pagenumber = 1;
        }

        console.log(
            `Fetching page ${i} of ${70} from ${targetUrl + pagenumber}`
        );
        setStatus(`Fetching page ${i} of ${70} from ${targetUrl + pagenumber}`);

        try {
            const response = await fetch(targetUrl + pagenumber);
            const data = await response.text();
            // Do something with the data
            const parser = new DOMParser();
            const htmlDocument = parser.parseFromString(data, "text/html");
            const htmlElement = htmlDocument.documentElement;

            const businessElement = htmlElement.querySelectorAll(".business");
            if (businessElement) {
                businesses.push(...businessElement);
            } else {
                console.log('No element with class "business" was found.');
            }
        } catch (error) {
            // Handle any errors
            console.error("Error:", error);
            setStatus("Failed! Check console for error.");
        }
    }
    console.log("Data fetched!");
    setStatus("Data fetched!");

    const uniqueBusinesses = uniq(businesses);

    return uniqueBusinesses;
};

let downloadExcelFile = (
    businesses: any[],
    setStatus: React.Dispatch<React.SetStateAction<string>>
) => {
    console.log("Creating the Excel file...");
    setStatus("Creating the Excel file...");

    const businessList = businesses.map((business: Element) => {
        if (business) {
            const name = business.querySelector("h3 > a")?.textContent || "";
            const address = business.querySelector("h3 + p")?.textContent || "";
            const phoneNumber =
                business.querySelector(".grid-x + p > a")?.textContent || "";
            const email =
                business.querySelector(".grid-x + p > a + a")?.textContent ||
                "";
            const website =
                business.querySelector(".grid-x + p + p")?.textContent || "";
            return [name, address, phoneNumber, email, website];
        }
        return ["", "", "", "", ""];
    });

    const data = [
        ["name", "address", "phone number", "email", "website"],
        // ["name", "address"],
        ...formatBusinesses(businessList),
    ];

    // Your 2D array of data
    console.log(data);

    try {
        // Create a workbook
        const wb = XLSX.utils.book_new();

        // Create a worksheet
        const ws = XLSX.utils.aoa_to_sheet(data);

        // Add the worksheet to the workbook
        XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

        // Format the worksheet as a table
        if (!ws["!ref"]) return null; // Sheet is empty (no data)
        const range = XLSX.utils.decode_range(ws["!ref"]);
        for (let col = range.s.c; col <= range.e.c; col++) {
            const column = XLSX.utils.encode_col(col);
            ws[column + "1"].s = { font: { bold: true } };
            for (let row = 2; row <= range.e.r; row++) {
                ws[column + row].s = {
                    border: {
                        bottom: { style: "thin", color: { auto: 1 } },
                    },
                };
            }
        }
        ws["!autofilter"] = { ref: XLSX.utils.encode_range(range) };
        ws["!cols"] = [{ width: 20 }, { width: 10 }, { width: 15 }]; // Set column widths

        console.log("Excel file created!");
        setStatus("Excel file created!");

        setTimeout(() => {
            console.log("Downloading Excel file...");
            setStatus("Downloading Excel file...");

            // Write the workbook to a file
            XLSX.writeFile(wb, "data.xlsx")

            console.log("Excel file downloaded!");
            setStatus("Excel file downloaded!");
        }, 2000);
    } catch (error) {
        console.error("Error:", error);
        setStatus("Failed! Check console for error.");
    }
};

let statusColor = (status: string) => {
    switch (status.toLowerCase()) {
        case "fetching data...":
            return "orange";
        case "data fetched!":
            return "green";
        case "creating the excel file...":
            return "orange";
        case "excel file created!":
            return "green";
        case "downloading excel file...":
            return "orange";
        case "excel file downloaded!":
            return "green";
        case "failed! check console for error.":
            return "red";
        case "idle":
            return "red";
        default:
            return "orange";
    }
};

function App() {
    const [businesses, setBusinesses] = useState<Element[]>([]);
    const [status, setStatus] = useState<string>("Idle");
    useEffect(() => {
        if (businesses.length > 0) {
            downloadExcelFile(businesses, setStatus);
        }
    }, [businesses]);

    const spanStyle = {
        color: statusColor(status),
        fontSize: "20px",
        fontWeight: "bold",
    };

    return (
        <div className="App">
            <h1>Sandyford Business Directory Scraper</h1>
            <button
                onClick={async () => {
                    setBusinesses(await fetchData(setStatus));
                }}>
                Download Excel Sheet of Sandyford Businesses
            </button>
            <h2>
                Current Status: <span style={spanStyle}>{status}</span>
            </h2>

            <hr />
            {businesses.map((business, index) => (
                <div
                    key={index}
                    dangerouslySetInnerHTML={{ __html: business.innerHTML }}
                />
            ))}
        </div>
    );
}

export default App;
