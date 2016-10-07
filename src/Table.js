define([], function () {


  /**
   * This is the type that needs to be implemented to create a SOM map.
   * Inheritance is not required, object may be duck typed.
   */

  function Table() {
    throw new Error("This type needs to be implemented. SOM uses it to load data.");
  }

  Table.ORDINAL = "ordinal";
  Table.CATEGORY = "category";
  Table.IGNORE = "ignore";

  Table.prototype.getName = function(){
    throw new Error("should return the name of the table");
  };

  Table.prototype.columnCount = function () {
    throw new Error("should return the total number of columns");
  };

  Table.prototype.columnLabel = function (columnIndex) {
    throw new Error("Should return human readable string for the column index");
  };

  Table.prototype.columnType = function (columIndex) {
    throw new Error("Should either return [Table.ORDINAL|Table.CATEGORY|Table.IGNORE]");
  };

  Table.prototype.rowCount = function(){
    throw new Error("Should return the number of rows");
  };

  Table.prototype.getValue = function (rowNumber, columnNumber) {
    throw new Error("Should return the value for a given rownumber/columnnumber");
  };

  return Table;

});