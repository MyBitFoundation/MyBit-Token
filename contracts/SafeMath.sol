
// library SafeMath {

//   /**
//   * @dev Multiplies two numbers, throws on overflow.
//   */
//   function mul(uint256 a, uint256 b) internal pure returns (uint256) {
//     if (a == 0) {
//       return 0;
//     }
//     uint256 c = a * b;
//     assert(c / a == b);
//     return c;
//   }

//   function div(uint256 a, uint256 b) internal pure returns (uint256) {
//     // assert(b > 0); // Solidity automatically throws when dividing by 0
//     // uint256 c = a / b;
//     // assert(a == b * c + a % b); // There is no case in which this doesn't hold
//     return a / b;
//   }

//   function sub(uint256 a, uint256 b) internal pure returns (uint256) {
//     assert(b <= a);
//     return a - b;
//   }

//   function add(uint256 a, uint256 b) internal pure returns (uint256) {
//     uint256 c = a + b;
//     assert(c >= a);
//     return c;
//   }
// }

library SafeMath {
    function add(uint a, uint b) internal pure returns (uint c) {
        c = a + b;
        require(c >= a);
    }
    function sub(uint a, uint b) internal pure returns (uint c) {
        require(b <= a);
        c = a - b;
    }
    function mul(uint a, uint b) internal pure returns (uint c) {
        c = a * b;
        require(a == 0 || c / a == b);
    }
    function div(uint a, uint b) internal pure returns (uint c) {
        require(b > 0);
        c = a / b;
    }
}
