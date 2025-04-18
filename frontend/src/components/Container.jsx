import styled from 'styled-components';

const Container = styled.div`
  max-width: ${props => props.maxWidth || '900px'};
  margin: 40px auto;
  padding: 16px;
  background: rgba(0, 0, 0, 0.07);
  border-radius: 16px;

  @media (max-width: 600px) {
    margin: 20px 10px;
    padding: 12px;
  }
`;

export default Container;
